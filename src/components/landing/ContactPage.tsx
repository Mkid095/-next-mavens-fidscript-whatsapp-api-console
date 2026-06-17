import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-[#8a886a] hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <img src="/logo.png" alt="FIDScript" className="h-8" />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none">FIDSCRIPT</span>
              <span className="text-[9px] text-yellow-500">by Next Mavens</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-2 gap-10 md:gap-16"
        >
          {/* Left: Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Get in touch</h1>
            <p className="text-[#8a886a] mb-8 leading-relaxed">
              Have a question, feedback, or need support? Fill out the form and we'll get back to you within 1–2 business days.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: <Mail className="w-5 h-5" />,
                  label: 'Email',
                  value: 'info@nextmavens.com',
                  href: 'mailto:info@nextmavens.com',
                },
                {
                  icon: <Phone className="w-5 h-5" />,
                  label: 'Phone',
                  value: '+254 746 269 657',
                  href: 'tel:+254746269657',
                },
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: 'Location',
                  value: 'Nairobi, Kenya',
                  href: null,
                },
              ].map(({ icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#6a6c5d] uppercase tracking-widest mb-0.5">{label}</div>
                    {href ? (
                      <a href={href} className="text-sm text-white hover:text-yellow-500 transition-colors">{value}</a>
                    ) : (
                      <div className="text-sm text-white">{value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-[#262413]">
              <div className="bg-[#11110a] border border-[#262413] rounded-2xl p-5">
                <div className="text-xs font-bold text-[#6a6c5d] uppercase tracking-widest mb-3">Response Time</div>
                <div className="space-y-2">
                  {[
                    { type: 'General Inquiries', time: '1–2 business days' },
                    { type: 'Technical Support', time: '2–3 business days' },
                    { type: 'Billing Questions', time: '1–2 business days' },
                  ].map(({ type, time }) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-[#8a886a]">{type}</span>
                      <span className="text-white font-medium">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#11110a] border border-[#262413] rounded-2xl p-8 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Message Sent!</h2>
                  <p className="text-[#8a886a] text-sm mb-6 leading-relaxed">
                    We've received your message and will get back to you within 1–2 business days. Check your inbox for a confirmation email.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-sm text-yellow-500 hover:text-yellow-400 font-semibold transition-colors"
                  >
                    Send another message →
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-widest mb-2">Name *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                        className="w-full px-4 py-3 bg-[#11110a] border border-[#262413] rounded-xl text-sm text-white placeholder-[#4a4a3a] focus:outline-none focus:border-yellow-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-widest mb-2">Email *</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@company.co.ke"
                        required
                        className="w-full px-4 py-3 bg-[#11110a] border border-[#262413] rounded-xl text-sm text-white placeholder-[#4a4a3a] focus:outline-none focus:border-yellow-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-widest mb-2">Subject</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                      className="w-full px-4 py-3 bg-[#11110a] border border-[#262413] rounded-xl text-sm text-white placeholder-[#4a4a3a] focus:outline-none focus:border-yellow-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-widest mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      rows={5}
                      required
                      className="w-full px-4 py-3 bg-[#11110a] border border-[#262413] rounded-xl text-sm text-white placeholder-[#4a4a3a] focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>

                  <p className="text-[10px] text-[#4a4a3a] text-center">
                    By submitting, you agree to our{' '}
                    <Link to="/privacy" className="text-[#6a6c5d] hover:text-white underline">Privacy Policy</Link>.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
