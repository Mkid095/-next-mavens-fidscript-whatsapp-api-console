import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, AlertCircle, HelpCircle } from 'lucide-react';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import LoginLeftPanel from './auth/LoginLeftPanel';
import SeoHead from './shared/SeoHead';

interface LoginViewProps {
  onLoginSuccess: (email: string, role: 'admin' | 'client') => void;
  onShowClientDashboard: () => void;
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

  const handleLoginSuccess = (email: string, _token: string, role: 'admin' | 'client') => {
    onLoginSuccess(email, role);
  };

  const switchMode = (mode: 'login' | 'register') => () => { setActiveMode(mode); setErrorMsg(''); };
  const tabClass = (active: boolean) =>
    `flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
      active ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#525252] hover:text-[#1a1a1a]'
    }`;

  return (
    <div className="min-h-screen lg:h-screen bg-white text-[#1a1a1a] antialiased flex flex-col lg:overflow-hidden">
      <SeoHead
        title={activeMode === 'register' ? 'Create Account' : 'Login'}
        description="Login to or register your FIDScript account to manage WhatsApp instances, send messages, and track your token balance."
        canonical="/login"
        schema="login"
      />

      <header className="w-full flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-[#e5e5e5] shrink-0 bg-white">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Home</span>
        </button>
        <img
          src="https://res.cloudinary.com/f65o17cm/image/upload/v1785452001/logo_w0ttyq.png"
          alt="FIDScript"
          className="h-8"
        />
        <a
          href="mailto:support@fidscript.com"
          className="flex items-center gap-1.5 text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </a>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <LoginLeftPanel />

        <main className="flex-1 flex justify-center px-4 py-8 lg:overflow-y-auto lg:min-h-0">
          <div className="w-full max-w-[440px] flex flex-col">
            <div className="flex bg-[#f8f8f8] border border-[#e5e5e5] rounded-full p-1 mb-5 shrink-0">
              <button onClick={switchMode('login')} className={tabClass(activeMode === 'login')}>Sign In</button>
              <button onClick={switchMode('register')} className={tabClass(activeMode === 'register')}>Create Account</button>
            </div>

            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#e5e5e5] rounded-[24px] p-6 md:p-7 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#f97316]" />
              <div className="text-center mb-5 pt-1">
                <h2 className="text-xl font-bold text-[#1a1a1a]">
                  {activeMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="mt-1 text-sm text-[#525252]">
                  {activeMode === 'login'
                    ? 'Sign in to access your dashboard'
                    : 'Get 500 free welcome tokens — no payment required'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                  <button
                    onClick={() => setErrorMsg('')}
                    className="ml-auto text-red-400 hover:text-red-600"
                    aria-label="Dismiss"
                  >
                    ✕
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
                  onSuccess={onShowClientDashboard}
                  onError={setErrorMsg}
                  onLoadingChange={setIsSubmitting}
                />
              )}
            </motion.div>

            <p className="text-[11px] text-[#a0a0a0] text-center mt-5 leading-relaxed">
              By continuing, you agree to FIDScript's{' '}
              <a href="/terms" className="text-[#525252] hover:text-[#f97316] underline-offset-2 hover:underline">Terms</a>{' '}and{' '}
              <a href="/privacy" className="text-[#525252] hover:text-[#f97316] underline-offset-2 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}