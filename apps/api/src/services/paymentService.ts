/**
 * paymentService - single service for all token purchase flows.
 *
 * Covers:
 * - Package-based purchase (initiate → STK push → callback)
 * - Custom amount purchase (tokens → KES at admin-configured rate)
 * - Admin award (manual token grant)
 * - Refund (reverse a prior purchase)
 *
 * All token credits go through this service - no direct token_balance updates elsewhere.
 */
import { randomUUID } from 'crypto';
import db from '../database/index.js';
import { pricingCacheInvalidate } from './pricingService.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PurchaseResult {
  success: boolean;
  reference?: string;
  checkoutRequestId?: string;
  amountKsh?: number;
  error?: string;
}

export interface CallbackResult {
  success: boolean;
  paymentId?: string;
  tokenCount?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Package-based purchase (STK push)
// ---------------------------------------------------------------------------

export interface InitiatePackagePurchaseParams {
  clientId: string;
  packageId: string;
  phoneNumber: string;
}

export async function initiatePackagePurchase(
  params: InitiatePackagePurchaseParams,
): Promise<PurchaseResult> {
  const { clientId, packageId, phoneNumber } = params;

  // Resolve package
  const pkg = db.prepare(
    'SELECT id, name, tokens, bonus_tokens, price_kes FROM token_packages WHERE id = ? AND is_active = 1'
  ).get(packageId) as { id: string; name: string; tokens: number; bonus_tokens: number; price_kes: number } | undefined;

  if (!pkg) return { success: false, error: 'Package not found or inactive' };

  const totalTokens = pkg.tokens + pkg.bonus_tokens;
  const reference = `PKG-${randomUUID()}`;
  const paymentId = randomUUID();

  db.prepare(`
    INSERT INTO payments
      (id, client_id, package_id, amount_kes, phone_number, status, token_count, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
  `).run(paymentId, clientId, packageId, pkg.price_kes, phoneNumber, totalTokens);

  // Call Tuma STK push
  const stkResult = await _stkPush({
    amount: Math.ceil(pkg.price_kes),
    phone: phoneNumber,
    reference,
    paymentId,
  });

  if (!stkResult.success) {
    db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(paymentId);
    return { success: false, error: stkResult.error };
  }

  if (stkResult.checkoutRequestId) {
    db.prepare('UPDATE payments SET checkout_request_id = ? WHERE id = ?').run(stkResult.checkoutRequestId, paymentId);
  }

  return {
    success: true,
    reference,
    checkoutRequestId: stkResult.checkoutRequestId,
    amountKsh: pkg.price_kes,
  };
}

// ---------------------------------------------------------------------------
// Custom amount purchase
// ---------------------------------------------------------------------------

export interface InitiateCustomPurchaseParams {
  clientId: string;
  tokens: number;
  phoneNumber: string;
  /** KES per token - defaults to 0.11 */
  rateKshPerToken?: number;
}

export async function initiateCustomPurchase(
  params: InitiateCustomPurchaseParams,
): Promise<PurchaseResult> {
  const { clientId, tokens, phoneNumber, rateKshPerToken = 0.11 } = params;

  if (tokens <= 0) return { success: false, error: 'Token count must be positive' };

  const amountKsh = Math.ceil(tokens * rateKshPerToken);
  const reference = `CUST-${randomUUID()}`;
  const paymentId = randomUUID();

  db.prepare(`
    INSERT INTO payments
      (id, client_id, amount_kes, phone_number, status, token_count, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
  `).run(paymentId, clientId, amountKsh, phoneNumber, tokens);

  const stkResult = await _stkPush({
    amount: amountKsh,
    phone: phoneNumber,
    reference,
    paymentId,
  });

  if (!stkResult.success) {
    db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(paymentId);
    return { success: false, error: stkResult.error };
  }

  if (stkResult.checkoutRequestId) {
    db.prepare('UPDATE payments SET checkout_request_id = ? WHERE id = ?').run(stkResult.checkoutRequestId, paymentId);
  }

  return {
    success: true,
    reference,
    checkoutRequestId: stkResult.checkoutRequestId,
    amountKsh,
  };
}

// ---------------------------------------------------------------------------
// M-Pesa callback (called by payments/callback route)
// ---------------------------------------------------------------------------

export async function handlePaymentCallback(
  checkoutRequestId: string,
  resultCode: number,
  resultDesc: string,
  mpesaReceipt?: string,
): Promise<CallbackResult> {
  if (resultCode !== 0) {
    db.prepare("UPDATE payments SET status = 'failed' WHERE checkout_request_id = ?").run(checkoutRequestId);
    return { success: false, error: resultDesc };
  }

  const payment = db.prepare(
    'SELECT id, client_id, token_count FROM payments WHERE checkout_request_id = ? AND status = ?'
  ).get(checkoutRequestId, 'pending') as { id: string; client_id: string; token_count: number } | undefined;

  if (!payment) return { success: false, error: 'Payment not found' };

  const { id: paymentId, client_id: clientId, token_count: tokenCount } = payment;

  db.prepare('UPDATE clients SET token_balance = token_balance + ? WHERE id = ?').run(tokenCount, clientId);

  db.prepare(`
    INSERT INTO token_transactions
      (id, client_id, type, amount, reference, mpesa_receipt, status, created_at)
    VALUES (?, ?, 'purchase', ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
  `).run(randomUUID(), clientId, tokenCount, paymentId, mpesaReceipt ?? '');

  db.prepare("UPDATE payments SET status = 'completed' WHERE id = ?").run(paymentId);

  _emitTokenUpdate(clientId, tokenCount).catch(console.error);

  return { success: true, paymentId, tokenCount };
}

// ---------------------------------------------------------------------------
// Admin award (manual token grant)
// ---------------------------------------------------------------------------

export interface AdminAwardParams {
  clientId: string;
  amount: number;
  reason: string;
  awardedBy: string;
}

export async function adminAwardTokens(
  params: AdminAwardParams,
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const { clientId, amount, reason } = params;
  if (amount <= 0) return { success: false, error: 'Amount must be positive' };

  db.prepare('UPDATE clients SET token_balance = token_balance + ? WHERE id = ?').run(amount, clientId);

  const txId = randomUUID();
  db.prepare(`
    INSERT INTO token_transactions
      (id, client_id, type, amount, reference, status, created_at)
    VALUES (?, ?, 'admin_award', ?, ?, 'completed', CURRENT_TIMESTAMP)
  `).run(txId, clientId, amount, reason);

  _emitTokenUpdate(clientId, amount).catch(console.error);

  return { success: true, transactionId: txId };
}

// ---------------------------------------------------------------------------
// Refund
// ---------------------------------------------------------------------------

export async function refundTokens(
  clientId: string,
  paymentId: string,
  amount: number,
  reason: string,
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  if (amount <= 0) return { success: false, error: 'Amount must be positive' };

  const client = db.prepare(
    'SELECT token_balance FROM clients WHERE id = ?'
  ).get(clientId) as { token_balance: number } | undefined;
  if (!client) return { success: false, error: 'Client not found' };

  db.prepare('UPDATE clients SET token_balance = MAX(0, token_balance - ?) WHERE id = ?').run(amount, clientId);

  const txId = randomUUID();
  db.prepare(`
    INSERT INTO token_transactions
      (id, client_id, type, amount, reference, status, created_at)
    VALUES (?, ?, 'refund', ?, ?, 'completed', CURRENT_TIMESTAMP)
  `).run(txId, clientId, -amount, reason);

  _emitTokenUpdate(clientId, -amount).catch(console.error);

  return { success: true, transactionId: txId };
}

// ---------------------------------------------------------------------------
// Token packages CRUD (admin use)
// ---------------------------------------------------------------------------

export function getTokenPackages(includeInactive = false) {
  return includeInactive
    ? db.prepare('SELECT * FROM token_packages ORDER BY price_kes ASC').all()
    : db.prepare('SELECT * FROM token_packages WHERE is_active = 1 ORDER BY price_kes ASC').all();
}

export function getTokenPackage(id: string) {
  return db.prepare('SELECT * FROM token_packages WHERE id = ?').get(id);
}

export interface CreatePackageParams {
  name: string;
  tokens: number;
  priceKsh: number;
  bonusTokens?: number;
}

export function createTokenPackage(params: CreatePackageParams): { id: string } {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO token_packages (id, name, tokens, price_kes, bonus_tokens, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
  `).run(id, params.name, params.tokens, params.priceKsh, params.bonusTokens ?? 0);
  return { id };
}

export function updateTokenPackage(
  id: string,
  updates: Partial<CreatePackageParams & { isActive: boolean }>,
): boolean {
  const fields: string[] = [];
  const vals: unknown[] = [];
  if (updates.name !== undefined)          { fields.push('name = ?');          vals.push(updates.name); }
  if (updates.tokens !== undefined)        { fields.push('tokens = ?');        vals.push(updates.tokens); }
  if (updates.priceKsh !== undefined)      { fields.push('price_kes = ?');    vals.push(updates.priceKsh); }
  if (updates.bonusTokens !== undefined)   { fields.push('bonus_tokens = ?');  vals.push(updates.bonusTokens); }
  if (updates.isActive !== undefined)      { fields.push('is_active = ?');    vals.push(updates.isActive ? 1 : 0); }
  if (fields.length === 0) return false;
  vals.push(id);
  const result = db.prepare(`UPDATE token_packages SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  return (result as { changes: number }).changes > 0;
}

export function deleteTokenPackage(id: string): boolean {
  const result = db.prepare('UPDATE token_packages SET is_active = 0 WHERE id = ?').run(id);
  return (result as { changes: number }).changes > 0;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface StkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  error?: string;
}

async function _stkPush(opts: {
  amount: number;
  phone: string;
  reference: string;
  paymentId: string;
}): Promise<StkPushResult> {
  try {
    const res = await fetch('http://localhost:8080/payment/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: opts.amount,
        phone: opts.phone,
        reference: opts.reference,
        externalId: opts.paymentId,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Tuma error ${res.status}: ${body}` };
    }
    const data = await res.json() as { checkoutRequestId?: string; status?: string };
    return {
      success: true,
      checkoutRequestId: data.checkoutRequestId ?? data.status,
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function _emitTokenUpdate(clientId: string, _delta: number): Promise<void> {
  try {
    const { emitTokenUpdate } = await import('../utils/paymentEmitter.js');
    const row = db.prepare(
      'SELECT token_balance FROM clients WHERE id = ?'
    ).get(clientId) as { token_balance: number } | undefined;
    emitTokenUpdate(clientId, {
      balance: row?.token_balance ?? 0,
      transaction_id: '',
      mpesa_receipt: undefined,
    });
  } catch {
    // SSE service may not be initialized - non-fatal
  }
}
