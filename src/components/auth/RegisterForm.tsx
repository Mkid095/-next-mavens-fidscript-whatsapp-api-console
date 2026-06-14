import React, { useState } from 'react';
import { Loader2, Zap, UserPlus } from 'lucide-react';
import { authApi } from '../../services/api';

interface RegisterFormProps {
  onSuccess: (token: string) => void;
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function RegisterForm({
  onSuccess,
  onError,
  onLoadingChange,
}: RegisterFormProps) {
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('2547');
  const [regPassword, setRegPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      onError('Please fill in all fields.');
      return;
    }

    onLoadingChange(true);
    onError('');

    const response = await authApi.clientRegister(
      regName.trim(),
      regEmail.trim().toLowerCase(),
      regPhone.trim(),
      regPassword,
    );

    if (response.success && response.data) {
      // Registration successful - now login to get token
      const loginResponse = await authApi.clientLogin(
        regEmail.trim().toLowerCase(),
        regPassword,
      );
      if (loginResponse.success && loginResponse.data) {
        localStorage.setItem('fidscript_client_token', loginResponse.data.token);
        if (loginResponse.data.client) {
          localStorage.setItem('fidscript_client_data', JSON.stringify(loginResponse.data.client));
        }
        onSuccess(loginResponse.data.token);
      } else {
        // Registration worked but auto-login failed - still success, user can login manually
        onSuccess('');
      }
    } else {
      onError(response.error || 'Registration failed. Please try again.');
    }

    onLoadingChange(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-1.5">
          Full Name
        </label>
        <input
          type="text"
          required
          placeholder="Jane Wanjiku"
          value={regName}
          onChange={(e) => setRegName(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-1.5">
          Business Email
        </label>
        <input
          type="email"
          required
          placeholder="jane@company.co.ke"
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-1.5">
          Phone Number
        </label>
        <input
          type="text"
          required
          placeholder="254712345678"
          value={regPhone}
          onChange={(e) => setRegPhone(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-1.5">
          Password
        </label>
        <input
          type="password"
          required
          placeholder="Create a secure password"
          value={regPassword}
          onChange={(e) => setRegPassword(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono"
        />
      </div>

      <div className="bg-[#1a2518] border border-[#2d4a2a] p-3 rounded-xl space-y-1">
        <p className="text-[10.5px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          Welcome Bonus: 500 Free Tokens!
        </p>
        <p className="text-[9.5px] text-[#aaa781] leading-relaxed normal-case">
          No payment required to get started. Use your 500 tokens to send messages and test the API.
        </p>
      </div>

      <button
        type="submit"
        className="w-full mt-2 bg-[#eab308] hover:bg-[#d9a307] text-[#070e0c] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all focus:outline-none"
      >
        <UserPlus className="w-4 h-4 text-[#070e0c]" />
        <span>Create Account - It is Free</span>
      </button>
    </form>
  );
}
