import React, { useState } from 'react';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/api';
import CodeInput from './CodeInput';
import { useResendCountdown } from './useResendCountdown';

interface LoginFormProps {
  defaultEmail: string;
  onSuccess: (email: string, token: string, role: 'admin' | 'client') => void;
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const LABEL = 'block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-2';
const INPUT =
  'w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono disabled:opacity-50';
const BTN =
  'w-full mt-2 bg-[#eab308] hover:bg-[#d9a307] disabled:opacity-50 disabled:cursor-not-allowed text-[#070e0c] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md focus:outline-none';

export default function LoginForm({
  defaultEmail,
  onSuccess,
  onError,
  onLoadingChange,
}: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { secondsLeft, start, canResend } = useResendCountdown(60);

  const setBusy = (b: boolean) => {
    setIsSubmitting(b);
    onLoadingChange(b);
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) {
      onError('Please enter your email.');
      return;
    }
    setBusy(true);
    onError('');
    const res = await authApi.requestCode(email.trim().toLowerCase());
    setBusy(false);
    if (res.success) {
      setStep('code');
      start(60);
      setCode('');
    } else {
      onError(res.error || 'Failed to send code. Please try again.');
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/\s/g, '').length < 6) {
      onError('Please enter the 6-digit code.');
      return;
    }
    setBusy(true);
    onError('');
    const res = await authApi.verifyCode(email.trim().toLowerCase(), code.trim());
    setBusy(false);
    if (res.success && res.data) {
      const { token, role } = res.data;
      const key = role === 'admin' ? 'fidscript_admin_token' : 'fidscript_client_token';
      localStorage.setItem(key, token);
      const successEmail = role === 'admin'
        ? (res.data.user?.email ?? email.trim())
        : (res.data.client?.email ?? email.trim());
      onSuccess(successEmail, token, role);
    } else {
      onError(res.error || 'Invalid or expired code.');
    }
  };

  const resend = async () => {
    if (!canResend) return;
    setBusy(true);
    onError('');
    const res = await authApi.requestCode(email.trim().toLowerCase());
    setBusy(false);
    if (res.success) {
      start(60);
      setCode('');
    } else {
      onError(res.error || 'Failed to resend code.');
    }
  };

  if (step === 'code') {
    return (
      <form onSubmit={verify} className="space-y-4">
        <button
          type="button"
          onClick={() => { setStep('email'); onError(''); }}
          className="flex items-center gap-1 text-[10px] text-[#8a886a] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Change email
        </button>
        <div>
          <p className="text-xs text-[#8f8c6d] mb-1">Enter the 6-digit code sent to</p>
          <p className="text-xs font-mono text-yellow-400 break-all">{email.trim().toLowerCase()}</p>
        </div>
        <CodeInput value={code} onChange={setCode} disabled={isSubmitting} />
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-[#7a775d]">
            {canResend ? "Didn't get it?" : `Resend in ${secondsLeft}s`}
          </span>
          <button
            type="button"
            onClick={resend}
            disabled={!canResend || isSubmitting}
            className="text-yellow-500 hover:text-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
          >
            Resend code
          </button>
        </div>
        <button type="submit" disabled={isSubmitting} className={BTN}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#070e0c]" /> : null}
          <span>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</span>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      <div>
        <label className={LABEL}>Email Address</label>
        <input
          type="email"
          required
          disabled={isSubmitting}
          placeholder="you@company.co.ke"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
        />
      </div>
      <button type="submit" disabled={isSubmitting} className={BTN}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#070e0c]" /> : <Mail className="w-4 h-4 text-[#070e0c]" />}
        <span>{isSubmitting ? 'Sending code...' : 'Send Code'}</span>
      </button>
      <p className="text-[10px] text-[#8f8c6d] text-center leading-relaxed">
        We'll email you a one-time code. No password needed.
      </p>
    </form>
  );
}
