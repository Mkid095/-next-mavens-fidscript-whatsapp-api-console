import React, { useState } from 'react';
import { Loader2, Gift, UserPlus, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/api';
import CodeInput from './CodeInput';
import { useResendCountdown } from './useResendCountdown';

interface RegisterFormProps {
  onSuccess: (token: string) => void;
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const LABEL = 'block text-xs font-semibold text-[#1a1a1a] mb-1.5';
const INPUT =
  'w-full px-4 py-3 bg-white border border-[#e5e5e5] text-[#1a1a1a] placeholder-[#a0a0a0] rounded-2xl focus:outline-none focus:border-[#f97316] text-sm transition-colors disabled:opacity-50';
const BTN =
  'w-full mt-4 bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 text-sm transition-colors focus:outline-none';

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
          className="flex items-center gap-1.5 text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Edit details
        </button>
        <div>
          <p className="text-sm text-[#525252] mb-1">Enter the 6-digit code sent to</p>
          <p className="text-sm font-mono text-[#f97316] break-all">{email.trim().toLowerCase()}</p>
        </div>
        <CodeInput value={code} onChange={setCode} disabled={isSubmitting} />
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#a0a0a0]">
            {canResend ? "Didn't get it?" : `Resend in ${secondsLeft}s`}
          </span>
          <button
            type="button"
            onClick={resend}
            disabled={!canResend || isSubmitting}
            className="text-[#f97316] hover:text-[#fb923c] disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
          >
            Resend code
          </button>
        </div>
        <button type="submit" disabled={isSubmitting} className={BTN}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>{isSubmitting ? 'Creating account...' : 'Verify & Create Account'}</span>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      <div>
        <label className={LABEL}>Full Name</label>
        <input
          type="text"
          required
          disabled={isSubmitting}
          placeholder="Jane Wanjiku"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label className={LABEL}>Business Email</label>
        <input
          type="email"
          required
          disabled={isSubmitting}
          placeholder="jane@company.co.ke"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label className={LABEL}>Phone Number</label>
        <input
          type="text"
          required
          disabled={isSubmitting}
          placeholder="254712345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT}
        />
      </div>

      <div className="bg-[#fff7ed] border border-[#fed7aa] p-4 rounded-2xl">
        <p className="text-sm font-bold text-[#f97316] flex items-center gap-1.5 mb-0.5">
          <Gift className="w-4 h-4" />
          Welcome Bonus: 500 Free Tokens!
        </p>
        <p className="text-sm text-[#525252]">
          No password required. Verify your email with a one-time code to get started.
        </p>
      </div>

      <button type="submit" disabled={isSubmitting} className={BTN}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        <span>{isSubmitting ? 'Sending code...' : 'Continue'}</span>
      </button>
    </form>
  );
}
