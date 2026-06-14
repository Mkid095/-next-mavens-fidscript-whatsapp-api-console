import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';

interface LoginViewProps {
  onLoginSuccess: (email: string, role: 'admin' | 'client', token: string) => void;
  onShowClientDashboard: (token: string) => void;
  defaultEmail?: string;
  initialMode?: 'login' | 'register';
}

export default function LoginView({
  onLoginSuccess,
  onShowClientDashboard,
  defaultEmail = '',
  initialMode = 'login',
}: LoginViewProps) {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSuccess = (email: string, token: string, role: 'admin' | 'client') => {
    onLoginSuccess(email, role, token);
  };

  const handleRegisterSuccess = (token: string) => {
    onShowClientDashboard(token);
  };

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] flex flex-col p-4 md:p-8 relative overflow-hidden font-suisse-intl antialiased">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#eab308]/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs text-[#8a886a] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="FIDScript" className="h-8" />
          <div className="flex flex-col">
            <span className="font-sans font-bold text-[16px] text-white tracking-tight leading-none">FIDSCRIPT WHATSAPP</span>
            <span className="text-[9px] text-yellow-500">by Next Mavens</span>
          </div>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto my-auto relative z-10 py-6">
        <div className="flex p-1.5 bg-[#14130d] border border-[#2b291a] rounded-2xl mb-4 select-none">
          <button
            onClick={() => { setActiveMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all ${
              activeMode === 'login'
                ? 'bg-[#eab308] text-[#070e0c]'
                : 'text-[#8c8a6b] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all ${
              activeMode === 'register'
                ? 'bg-[#eab308] text-[#070e0c]'
                : 'text-[#8c8a6b] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="bg-[#100f0a]/90 border border-[#2b291a] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="space-y-2 text-center pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-[11px] text-[#8f8c6d]">
              {activeMode === 'login'
                ? 'Sign in to access your dashboard'
                : 'Get 500 free welcome tokens - No payment required'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-950/50 border border-red-500/20 text-xs text-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
              <button
                onClick={() => setErrorMsg('')}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {activeMode === 'login' ? (
            <LoginForm
              defaultEmail={defaultEmail}
              onSuccess={handleLoginSuccess}
              onError={setErrorMsg}
              onLoadingChange={setIsSubmitting}
            />
          ) : (
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onError={setErrorMsg}
              onLoadingChange={setIsSubmitting}
            />
          )}
        </div>
      </main>
    </div>
  );
}
