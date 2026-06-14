import React, { useState, useEffect } from 'react';
import {
  Wallet, CreditCard, History, CheckCircle,
  Clock, XCircle, AlertCircle, Zap, Calculator,
  MessagesSquare, Image as ImageIcon, FileText, Video, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { paymentsApi } from '../../services/api';
import type { Client, TokenPackage } from '../../services/api';
import type { PaymentTransaction } from '../../services/payments';

interface TokenStoreSectionProps {
  client: Client;
  tokenPackages: TokenPackage[];
  tokenBalance: number;
  onTokenBalanceChange: (b: number) => void;
  onTokenDeduct: (n: number) => void;
}

type ViewTab = 'buy' | 'history';

const PER_TOKEN_RATE = 0.11;

const MESSAGE_TYPES = [
  { label: 'Text', Icon: MessagesSquare, perMsg: 1 },
  { label: 'Image', Icon: ImageIcon, perMsg: 2 },
  { label: 'Document', Icon: FileText, perMsg: 2 },
  { label: 'Video', Icon: Video, perMsg: 3 },
];

function calcCost(tokens: number) {
  return {
    total: Math.ceil(tokens * PER_TOKEN_RATE),
    perToken: PER_TOKEN_RATE,
    label: 'Custom',
    displayTokens: tokens,
  };
}

function StatusPill({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
      <CheckCircle className="w-2.5 h-2.5" /> Completed
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
      <XCircle className="w-2.5 h-2.5" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">
      <Clock className="w-2.5 h-2.5" /> {status}
    </span>
  );
}

export default function TokenStoreSection({
  client,
  tokenPackages,
  tokenBalance,
  onTokenBalanceChange,
  onTokenDeduct,
}: TokenStoreSectionProps) {
  const [tab, setTab] = useState<ViewTab>('buy');
  const [selectedPkg, setSelectedPkg] = useState<TokenPackage | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customTokens, setCustomTokens] = useState(500);
  const [phone, setPhone] = useState(client.phone || '');
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState('');
  const [pendingRef, setPendingRef] = useState('');
  const [pendingCheckoutId, setPendingCheckoutId] = useState('');
  const [txs, setTxs] = useState<PaymentTransaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  useEffect(() => {
    if (tab === 'history' && txs.length === 0) {
      setLoadingTxs(true);
      paymentsApi.getHistory().then(res => {
        if (res.success && res.data) setTxs(res.data);
      }).finally(() => setLoadingTxs(false));
    }
  }, [tab]);

  const customCost = calcCost(customTokens);

  const doPayPkg = async (pkgId: string) => {
    setPaying(true);
    setPayMsg('');
    setPendingRef('');
    setPendingCheckoutId('');
    try {
      const res = await paymentsApi.initiatePayment({ package_id: pkgId, phone_number: phone });
      if (res.success) {
        // Use checkout_request_id as primary ref (status endpoint looks it up)
        setPendingRef(res.data?.checkout_request_id || '');
        setPendingCheckoutId(res.data?.checkout_request_id || '');
        setPayMsg(`M-Pesa prompt sent to ${phone} — complete payment on your phone.`);
      } else {
        setPayMsg('Error: ' + (res.error || 'Unknown error'));
      }
    } catch (e) {
      setPayMsg('Error: ' + String(e));
    }
    setPaying(false);
  };

  const doPayCustom = async (tokens: number) => {
    setPaying(true);
    setPayMsg('');
    setPendingRef('');
    setPendingCheckoutId('');
    try {
      const res = await paymentsApi.initiateCustomPayment({ tokens, phone_number: phone });
      if (res.success) {
        setPendingRef(res.data?.checkout_request_id || '');
        setPendingCheckoutId(res.data?.checkout_request_id || '');
        setPayMsg(`M-Pesa prompt sent to ${phone} — complete payment on your phone.`);
      } else {
        setPayMsg('Error: ' + (res.error || 'Unknown error'));
      }
    } catch (e) {
      setPayMsg('Error: ' + String(e));
    }
    setPaying(false);
  };

  const handlePayPkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPkg) doPayPkg(selectedPkg.id);
  };

  const handlePayCustom = (e: React.FormEvent) => {
    e.preventDefault();
    doPayCustom(customTokens);
  };

  const handlePendingStatus = (status: string) => {
    if (status === 'completed') {
      setPayMsg('Payment confirmed! Tokens added to your balance.');
    } else if (status === 'failed') {
      setPayMsg('Payment failed. Please try again.');
    } else if (status === 'timeout') {
      setPayMsg('Payment timed out. Check your M-Pesa app and try again if needed.');
    }
  };

  const buyContent = (
    <div className="space-y-5">
      {/* Package / custom toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide">Choose a Package</h4>
          <button
            onClick={() => setUseCustom(!useCustom)}
            className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            {useCustom ? 'Show fixed packages' : '+ Custom amount'}
          </button>
        </div>

        {!useCustom ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tokenPackages.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPkg?.id === pkg.id
                    ? 'border-yellow-500 bg-yellow-50/50 shadow-md'
                    : 'border-stone-200 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-stone-500 uppercase">{pkg.name}</span>
                  {pkg.bonus_tokens > 0 && (
                    <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      +{pkg.bonus_tokens} bonus
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-forest-deep">{pkg.tokens.toLocaleString()}</div>
                <div className="text-[10px] text-stone-400 mb-2">tokens</div>
                <div className="text-sm font-bold text-yellow-700">KES {pkg.price_kes.toLocaleString()}</div>
                <div className="text-[9px] text-stone-400">KES {(pkg.price_kes / (pkg.tokens + pkg.bonus_tokens)).toFixed(2)}/token</div>
              </div>
            ))}
          </div>
        ) : (
          <CustomCalc tokens={customTokens} onTokens={setCustomTokens} cost={customCost} />
        )}
      </div>

      {/* Purchase form */}
      {selectedPkg && !useCustom && (
        <PayForm pkg={selectedPkg} phone={phone} onPhone={setPhone} paying={paying} msg={payMsg} onPay={handlePayPkg} />
      )}
      {useCustom && (
        <PayForm
          pkg={{ id: 'custom', name: 'Custom', tokens: customTokens, price_kes: customCost.total, bonus_tokens: 0 }}
          phone={phone}
          onPhone={setPhone}
          paying={paying}
          msg={payMsg}
          onPay={handlePayCustom}
          custom
        />
      )}
      {(pendingRef || pendingCheckoutId) && (
        <PendingPoller
          reference={pendingRef}
          checkoutId={pendingCheckoutId}
          onStatusChange={handlePendingStatus}
        />
      )}
    </div>
  );

  const historyContent = loadingTxs ? (
    <div className="text-center py-12 text-stone-400">
      <div className="w-8 h-8 border-2 border-stone-300 border-t-yellow-500 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-xs">Loading transactions...</p>
    </div>
  ) : txs.length === 0 ? (
    <div className="text-center py-12 space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto">
        <History className="w-6 h-6 text-stone-300" />
      </div>
      <p className="text-sm font-bold text-forest-deep">No transactions yet</p>
      <p className="text-xs text-graphite">Your payment history will appear here after your first purchase.</p>
    </div>
  ) : (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-stone-50 rounded-xl text-[9px] font-bold text-stone-500 uppercase tracking-wide mb-2">
        <span>Date</span>
        <span>Package</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Status</span>
      </div>
      {txs.map(tx => (
        <div key={tx.id} className="grid grid-cols-4 gap-2 px-3 py-3 rounded-xl hover:bg-stone-50 transition-colors items-center border-b border-stone-100 last:border-0">
          <div>
            <p className="text-[11px] font-bold text-forest-deep">
              {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[9px] text-stone-400 font-mono truncate max-w-[120px]">
              {tx.payhero_reference || tx.checkout_request_id || tx.id}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-forest-deep">{tx.package_name || tx.package_id || 'Custom'}</p>
            <p className="text-[9px] text-stone-400">
              {tx.tokens ? `${(tx.tokens + (tx.bonus_tokens || 0)).toLocaleString()} tokens` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-yellow-700">KES {tx.amount_kes.toLocaleString()}</p>
          </div>
          <div className="flex justify-end"><StatusPill status={tx.status} /></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-stone-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Token Store</h3>
              <p className="text-[11px] text-graphite">Buy tokens for WhatsApp messaging</p>
            </div>
          </div>
          {/* Tab toggle */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <TabBtn active={tab === 'buy'} onClick={() => setTab('buy')} icon={<Zap className="w-3.5 h-3.5" />} label="Buy" />
            <TabBtn active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="w-3.5 h-3.5" />} label="History" />
          </div>
        </div>

        {/* Body */}
        <div className="pt-5">
          {tab === 'buy' ? buyContent : historyContent}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
        active ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500 hover:text-forest-deep'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CustomCalc({ tokens, onTokens, cost }: {
  tokens: number;
  onTokens: (n: number) => void;
  cost: { total: number; perToken: number; label: string };
}) {
  const presets = [100, 500, 1000, 2000];

  return (
    <div className="bg-[#fafaf5] border border-[#eaebe4] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-yellow-600" />
        <span className="text-xs font-bold text-forest-deep">Custom Token Calculator</span>
        <span className="ml-auto text-[9px] text-stone-400">KES {cost.perToken.toFixed(2)}/token</span>
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        {presets.map(v => (
          <button
            key={v}
            onClick={() => onTokens(v)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              tokens === v ? 'bg-forest-deep text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
          >
            {v >= 1000 ? `${v / 1000}K` : v}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range" min={10} max={5000} step={10} value={tokens}
          onChange={e => onTokens(Number(e.target.value))}
          className="flex-1 accent-yellow-500"
        />
        <div className="relative w-28">
          <input
            type="number" min={10} max={999999} value={tokens}
            onChange={e => onTokens(Math.max(10, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-center text-sm font-bold text-forest-deep focus:outline-none focus:border-yellow-500 pr-8"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-stone-400">tok</span>
        </div>
      </div>

      {/* Cost */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#eaebe4] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-yellow-700">KES {cost.total.toLocaleString()}</p>
          <p className="text-[9px] text-stone-400">Total cost</p>
        </div>
        <div className="bg-white border border-[#eaebe4] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-green-700">{cost.displayTokens.toLocaleString()}</p>
          <p className="text-[9px] text-stone-400">Tokens</p>
        </div>
      </div>

      {/* Message equivalents */}
      <div>
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-2">What you can send</p>
        <div className="grid grid-cols-2 gap-2">
          {MESSAGE_TYPES.map(({ label, Icon, perMsg }) => (
            <div key={label} className="flex items-center gap-2 bg-white border border-[#eaebe4] rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-stone-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-forest-deep">{Math.floor(tokens / perMsg).toLocaleString()}</p>
                <p className="text-[9px] text-stone-400">{label.toLowerCase()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PayForm({
  pkg,
  phone,
  onPhone,
  paying,
  msg,
  onPay,
  custom,
  onPending,
}: {
  pkg: { id: string; name: string; tokens: number; price_kes: number };
  phone: string;
  onPhone: (v: string) => void;
  paying: boolean;
  msg: string;
  onPay: (e: React.FormEvent) => void;
  custom?: boolean;
  onPending?: (reference: string, checkoutId: string) => void;
}) {
  const isError = msg.includes('Error') || msg.includes('error') || msg.includes('failed');
  return (
    <form onSubmit={onPay} className="bg-[#fafaf5] border border-[#eaebe4] p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-forest-deep">{pkg.name}</h4>
          <p className="text-xs text-graphite">{pkg.tokens.toLocaleString()} tokens</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-yellow-800">KES {pkg.price_kes.toLocaleString()}</p>
          <p className="text-[10px] text-stone-400">Total</p>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">M-Pesa Phone Number</label>
        <input
          type="text"
          required
          placeholder="0740123456"
          value={phone}
          onChange={e => onPhone(e.target.value)}
          className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono text-sm text-forest-deep"
        />
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {isError ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          {msg}
        </div>
      )}

      <button
        type="submit"
        disabled={paying || !phone}
        className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
          custom
            ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950'
            : 'bg-forest-deep hover:bg-[#33301a] text-white'
        }`}
      >
        <CreditCard className="w-4 h-4 shrink-0" />
        {paying ? 'Processing...' : `Pay KES ${pkg.price_kes.toLocaleString()} via M-Pesa`}
      </button>
    </form>
  );
}

function PendingPoller({
  reference,
  checkoutId,
  onStatusChange,
}: {
  reference: string;
  checkoutId: string;
  onStatusChange: (status: string) => void;
}) {
  const [state, setState] = useState<'waiting' | 'timeout' | 'done'>('waiting');
  const [elapsed, setElapsed] = useState(0);
  const MAX_SECONDS = 120;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        // Prefer checkout_request_id (status endpoint stores it in checkout_request_id column)
        const res = await paymentsApi.getPaymentStatus(checkoutId || reference);
        if (res.success && res.data) {
          if (res.data.status === 'completed') {
            setState('done');
            onStatusChange('completed');
            clearInterval(interval);
            clearTimeout(timeout);
            return;
          }
          if (res.data.status === 'failed') {
            setState('done');
            onStatusChange('failed');
            clearInterval(interval);
            clearTimeout(timeout);
            return;
          }
        }
        setElapsed(e => e + 5);
      } catch {}
    };

    interval = setInterval(poll, 5000);
    timeout = setTimeout(() => {
      clearInterval(interval);
      setState('timeout');
      onStatusChange('timeout');
    }, MAX_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [checkoutId, reference]);

  if (state === 'timeout') {
    return (
      <div className="p-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Payment may have failed — check your M-Pesa app. Tokens will be added automatically once confirmed.
      </div>
    );
  }

  if (state === 'done') return null;

  return (
    <div className="p-3 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
      Waiting for M-Pesa confirmation... {elapsed > 0 && `(${elapsed}s)`}
    </div>
  );
}
