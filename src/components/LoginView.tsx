import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Shield,
  AlertCircle,
  Loader2,
  Globe,
  Heart,
  Smartphone,
  UserPlus,
  Coins,
  X
} from 'lucide-react';
import { authApi, clientsApi, Plan } from '../services/api';

interface LoginViewProps {
  clients: { id: string; name: string; email: string }[];
  onLoginSuccess: (email: string, role: 'admin' | 'client') => void;
  onRegisterClient: (name: string, email: string, phone: string, plan: string) => void;
  defaultEmail?: string;
}

export default function LoginView({
  onLoginSuccess,
  onRegisterClient,
  defaultEmail = 'admin@fidscript.io'
}: LoginViewProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  const [loginRole, setLoginRole] = useState<'admin' | 'client'>('admin');

  // Login Form states
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register Form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('2547');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');

  // Fetch plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      const response = await plansApi.getAll();
      if (response.success && response.data) {
        setPlans(response.data);
        if (response.data.length > 0) {
          setSelectedPlan(response.data[0].id);
        }
      }
    };
    fetchPlans();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const response = await authApi.login(email.trim(), password);

    if (response.success && response.data) {
      // Store token
      localStorage.setItem('fidscript_admin_token', response.data.token);
      onLoginSuccess(response.data.user.email, 'admin');
    } else {
      setErrorMsg(response.error || 'Login failed. Please check your credentials.');
    }

    setIsSubmitting(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Please enter both Company Name and Email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const response = await clientsApi.create({
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      plan_id: selectedPlan || undefined,
    });

    if (response.success) {
      onRegisterClient(
        regName.trim(),
        regEmail.trim().toLowerCase(),
        regPhone.trim(),
        plans.find(p => p.id === selectedPlan)?.name || 'Standard'
      );
    } else {
      setErrorMsg(response.error || 'Registration failed. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-suisse-intl antialiased">

      {/* Decorative Radial Backdrop Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#eab308]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-[3.5px] items-end h-[18px]">
            <span className="w-[3px] bg-[#eab308] h-3 rounded-full" />
            <span className="w-[3px] bg-[#eab308] h-[18px] rounded-full" />
            <span className="w-[3px] bg-[#eab308] h-[14px] rounded-full" />
          </div>
          <div className="font-sans font-bold text-[18px] text-white tracking-tight leading-none">
            FIDScript <span className="text-yellow-400 font-mono text-xs ml-1 font-normal select-none px-1.5 py-0.5 bg-yellow-950/80 rounded border border-yellow-500/20">by Next Mavens</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#8a886a] bg-[#1a1910] border border-[#302e1c] px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span>WhatsApp API Platform</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-auto relative z-10 py-6">

        {/* Modern Tabs: Sign In vs Register */}
        <div className="flex p-1.5 bg-[#14130d] border border-[#2b291a] rounded-2xl mb-4 select-none">
          <button
            onClick={() => {
              setActiveMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all ${
              activeMode === 'login'
                ? 'bg-[#eab308] text-[#070e0c]'
                : 'text-[#8c8a6b] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveMode('register');
              setErrorMsg('');
            }}
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

          <div className="space-y-2 text-center pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 mb-1">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeMode === 'login' ? 'WhatsApp API Gateway' : 'Create Your Account'}
            </h2>
            <p className="text-[11px] text-[#8f8c6d]">
              {activeMode === 'login'
                ? 'Access the FIDScript admin dashboard'
                : 'Get started with WhatsApp API for your business'
              }
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
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">

              <div>
                <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@fidscript.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1e1d13]/60 border border-[#38351c] text-stone-100 placeholder-[#7a775d] rounded-xl focus:outline-none focus:border-yellow-600 text-xs transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#eab308] hover:bg-[#d9a307] text-[#070e0c] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all duration-150 shadow-md focus:outline-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#070e0c]" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-[#070e0c]" />
                    <span>Access Admin Dashboard</span>
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#302e1c] text-center">
                <span className="text-[10px] text-[#7a775d]">
                  Demo credentials: admin@fidscript.io / admin123
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#8f8c6b] uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Kenya Ltd"
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
                  placeholder="operations@company.co.ke"
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
                  Select Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1e1d13] border border-[#38351c] text-white rounded-xl focus:outline-none focus:border-yellow-600 text-xs"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - KES {plan.price_monthly}/month
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#242214] border border-[#3d3a1e] p-3 rounded-xl space-y-1">
                <p className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  Message Pricing:
                </p>
                <p className="text-[9.5px] text-[#aaa781] leading-relaxed normal-case">
                  <strong>1 KES per 8 messages</strong>. Volume discounts available for high-volume users.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#eab308] hover:bg-[#d9a307] text-[#070e0c] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all focus:outline-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-[#070e0c]" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="bg-[#100f0a]/30 p-2.5 rounded-2xl border border-[#2b291a]/50">
            <Globe className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-[9px] text-white font-bold">Fast API</p>
            <p className="text-[8px] text-[#8c8a6b]">REST Integration</p>
          </div>
          <div className="bg-[#100f0a]/30 p-2.5 rounded-2xl border border-[#2b291a]/50">
            <Smartphone className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-[9px] text-white font-bold">QR Connect</p>
            <p className="text-[8px] text-[#8c8a6b]">Link WhatsApp</p>
          </div>
          <div className="bg-[#100f0a]/30 p-2.5 rounded-2xl border border-[#2b291a]/50">
            <Coins className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-[9px] text-white font-bold">Ksh 1/8 msgs</p>
            <p className="text-[8px] text-[#8c8a6b]">Volume Pricing</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-[10px] text-[#7a775d] relative z-10 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-[#232115]">
        <p>© 2026 Next Mavens. FIDScript WhatsApp API Platform.</p>
        <div className="flex items-center gap-1.5 justify-center">
          <span>Built for Kenyan businesses</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
        </div>
      </footer>
    </div>
  );
}
