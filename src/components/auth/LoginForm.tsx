import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authApi } from '../../services/api';

interface LoginFormProps {
  defaultEmail: string;
  onSuccess: (email: string, token: string, role: 'admin' | 'client') => void;
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function LoginForm({
  defaultEmail,
  onSuccess,
  onError,
  onLoadingChange,
}: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onLoadingChange(true);
    onError('');

    const adminResponse = await authApi.login(email.trim(), password);
    if (adminResponse.success && adminResponse.data) {
      localStorage.setItem('fidscript_admin_token', adminResponse.data.token);
      onSuccess(adminResponse.data.user.email, adminResponse.data.token, 'admin');
      setIsSubmitting(false);
      onLoadingChange(false);
      return;
    }

    const clientResponse = await authApi.clientLogin(email.trim(), password);
    if (clientResponse.success && clientResponse.data) {
      localStorage.setItem('fidscript_client_token', clientResponse.data.token);
      onSuccess(
        clientResponse.data.client?.email || email,
        clientResponse.data.token,
        'client'
      );
      setIsSubmitting(false);
      onLoadingChange(false);
      return;
    }

    onError(clientResponse.error || 'Login failed. Please check your credentials.');
    setIsSubmitting(false);
    onLoadingChange(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          required
          disabled={isSubmitting}
          placeholder="you@company.co.ke"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-2">
          Password
        </label>
        <input
          type="password"
          required
          disabled={isSubmitting}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 bg-[#eab308] hover:bg-[#d9a307] disabled:opacity-50 disabled:cursor-not-allowed text-[#070e0c] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all duration-150 shadow-md focus:outline-none"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#070e0c]" />
        ) : null}
        <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
      </button>
    </form>
  );
}
