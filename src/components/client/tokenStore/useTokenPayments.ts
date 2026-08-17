import { useState, useCallback } from 'react';
import { paymentsApi } from '../../../services/api';

/**
 * Manages the M-Pesa payment flow: initiating the request, tracking pending
 * state, and exposing handlers for the package and custom-amount forms.
 */
export function useTokenPayments(phone: string) {
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState('');
  const [pendingRef, setPendingRef] = useState('');
  const [pendingCheckoutId, setPendingCheckoutId] = useState('');

  const startPayment = async (
    initiate: () => Promise<{ success: boolean; data?: { checkout_request_id?: string }; error?: string }>
  ) => {
    setPaying(true);
    setPayMsg('');
    setPendingRef('');
    setPendingCheckoutId('');
    try {
      const res = await initiate();
      if (res.success) {
        setPendingRef(res.data?.checkout_request_id || '');
        setPendingCheckoutId(res.data?.checkout_request_id || '');
        setPayMsg(`M-Pesa prompt sent to ${phone} - complete payment on your phone.`);
      } else {
        setPayMsg('Error: ' + (res.error || 'Unknown error'));
      }
    } catch (e) {
      setPayMsg('Error: ' + String(e));
    }
    setPaying(false);
  };

  const doPayPkg = useCallback(
    (pkgId: string) =>
      startPayment(() => paymentsApi.initiatePayment({ package_id: pkgId, phone_number: phone })),
    [phone]
  );

  const doPayCustom = useCallback(
    (tokens: number) =>
      startPayment(() => paymentsApi.initiateCustomPayment({ tokens, phone_number: phone })),
    [phone]
  );

  const confirmMessage = useCallback(() => {
    setPayMsg('Payment confirmed! Tokens added to your balance.');
    setPendingRef('');
    setPendingCheckoutId('');
  }, []);

  const setStatusMessage = useCallback((status: string) => {
    if (status === 'completed') {
      setPayMsg('Payment confirmed! Tokens added to your balance.');
    } else if (status === 'failed') {
      setPayMsg('Payment failed. Please try again.');
    } else if (status === 'timeout') {
      setPayMsg('Payment timed out. Check your M-Pesa app and try again if needed.');
    }
  }, []);

  return {
    paying,
    payMsg,
    pendingRef,
    pendingCheckoutId,
    doPayPkg,
    doPayCustom,
    confirmMessage,
    setStatusMessage,
  };
}
