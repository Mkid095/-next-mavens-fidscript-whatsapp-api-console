import React, { useState } from 'react';
import { Loader2, Zap, UserPlus, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/api';
import CodeInput from './CodeInput';
import { useResendCountdown } from './useResendCountdown';

interface RegisterFormProps {
  onSuccess: (token: string) => void;
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const LABEL = 'block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-1.5';
const INPUT =
  'w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors disabled:opacity-50';
const BTN =
  'w-full mt-2 bg-[#eab308] hover:bg-[#d9a307] disabled:opacity-50 disabled:cursor-not-allowed text-[#070e0c] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all focus:outline-none';

export default function RegisterForm({ onSuccess, onError, onLoadingChange }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('2547');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { secondsLeft, start, canResend } = useResendCountdown(60);

  const setBusy = (b: boolean) => {
    setIsSubmitting(b);
    onLoadingChange(b);
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      onError('Please fill in all fields.');
      return;
    }
    setBusy(true);
    onError('');
    const res = await authApi.clientRequestCode(name.trim(), email.trim().toLowerCase(), phone.trim());
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
    const res = await authApi.clientVerifyCode(name.trim(), email.trim().toLowerCase(), phone.trim(), code.trim());
    setBusy(false);
    if (res.success && res.data) {
      localStorage.setItem('fidscript_client_token', res.data.token);
      onSuccess(res.data.token);
    } else {
      onError(res.error || 'Invalid or expired code.');
    }
  };

  const resend = async () => {
    if (!canResend) return;
    setBusy(true);
    onError('');
    const res = await authApi.clientRequestCode(name.trim(), email.trim().toLowerCase(), phone.trim());
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
          onClick={() => { setStep('details'); onError(''); }}
          className="flex items-center gap-1 text-[10px] text-[#8a886a] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Edit details
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
          <span>{isSubmitting ? 'Creating account...' : 'Verify & Create Account'}</span>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      <div>
        <label className={LABEL}>Full Name</label>
        <input type="text" required disabled={isSubmitting} placeholder="Jane Wanjiku" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Business Email</label>
        <input type="email" required disabled={isSubmitting} placeholder="jane@company.co.ke" value={email} onChange={(e) => setEmail(e.target.value)} className={`${INPUT} font-mono`} />
      </div>
      <div>
        <label className={LABEL}>Phone Number</label>
        <input type="text" required disabled={isSubmitting} placeholder="254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${INPUT} font-mono`} />
      </div>

      <div className="bg-[#1a2518] border border-[#2d4a2a] p-3 rounded-xl space-y-1">
        <p className="text-[10.5px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          Welcome Bonus: 500 Free Tokens!
        </p>
        <p className="text-[9.5px] text-[#aaa781] leading-relaxed normal-case">
          No password required. Verify your email with a one-time code to get started.
        </p>
      </div>

      <button type="submit" disabled={isSubmitting} className={BTN}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#070e0c]" /> : <UserPlus className="w-4 h-4 text-[#070e0c]" />}
        <span>{isSubmitting ? 'Sending code...' : 'Continue'}</span>
      </button>
    </form>
  );
}
