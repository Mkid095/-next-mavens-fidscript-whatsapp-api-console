import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import Header from './Header';

export default function ContactPage() {
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <div className="min-h-screen bg-white text-[#1a1a1a] antialiased">
      <SeoHead
        title="Contact Us"
        description="Get in touch with the FIDScript team. Questions about WhatsApp API integration, pricing, billing, or technical support."
        canonical="/contact"
        schema="contact"
        breadcrumbs={[{ name: 'Contact', url: '/contact' }]}
      />

      <Header scrolled={scrolled} onScroll={() => setScrolled(window.scrollY > 10)} />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-2 gap-10 md:gap-16"
        >
          {/* Left: Info */}
          <div>
            <h1
              className="text-[clamp(28px,4vw,40px)] font-bold text-[#1a1a1a] leading-tight mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Get in touch
            </h1>
            <p className="text-base text-[#525252] mb-8 leading-relaxed">
              Have a question, feedback, or need support? Fill out the form and we'll get back to you within 1–2 business days.
            </p>

            <div className="space-y-5">
              {[
                { icon: Mail, label: 'Email', value: 'info@nextmavens.com', href: 'mailto:info@nextmavens.com' },
                { icon: Phone, label: 'Phone', value: '+254 746 269 657', href: 'tel:+254746269657' },
                { icon: MapPin, label: 'Location', value: 'Nairobi, Kenya', href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-[#f97316] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest mb-0.5">{label}</div>
                    {href ? (
                      <a href={href} className="text-sm text-[#1a1a1a] hover:text-[#f97316] transition-colors">{value}</a>
                    ) : (
                      <div className="text-sm text-[#1a1a1a]">{value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-[#e5e5e5]">
              <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-2xl p-5">
                <div className="text-xs font-bold text-[#a0a0a0] uppercase tracking-widest mb-3">Response Time</div>
                <div className="space-y-2">
                  {[
                    { type: 'General Inquiries', time: '1–2 business days' },
                    { type: 'Technical Support', time: '2–3 business days' },
                    { type: 'Billing Questions', time: '1–2 business days' },
                  ].map(({ type, time }) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-[#525252]">{type}</span>
                      <span className="text-[#1a1a1a] font-medium">{time}</span>
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
                  className="bg-white border border-[#e5e5e5] rounded-2xl p-8 text-center shadow-sm"
                >
                  <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-[#16a34a]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Message Sent!</h2>
                  <p className="text-sm text-[#525252] mb-6 leading-relaxed">
                    We've received your message and will get back to you within 1–2 business days.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-sm text-[#f97316] hover:text-[#fb923c] font-semibold transition-colors"
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
                      <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Name *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                        className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-sm text-[#1a1a1a] placeholder-[#a0a0a0] focus:outline-none focus:border-[#f97316] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Email *</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@company.co.ke"
                        required
                        className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-sm text-[#1a1a1a] placeholder-[#a0a0a0] focus:outline-none focus:border-[#f97316] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Subject</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                      className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-sm text-[#1a1a1a] placeholder-[#a0a0a0] focus:outline-none focus:border-[#f97316] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Message *</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      rows={5}
                      required
                      className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-sm text-[#1a1a1a] placeholder-[#a0a0a0] focus:outline-none focus:border-[#f97316] transition-colors resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-3.5 bg-[#f97316] hover:bg-[#fb923c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-full transition-colors flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>

                  <p className="text-xs text-[#a0a0a0] text-center">
                    By submitting, you agree to our{' '}
                    <Link to="/privacy" className="text-[#525252] hover:text-[#f97316] underline">Privacy Policy</Link>.
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
