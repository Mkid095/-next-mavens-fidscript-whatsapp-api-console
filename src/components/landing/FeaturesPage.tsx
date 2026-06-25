import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, Shield, BarChart3, Code2, Users, Smartphone, Globe, Key, Bell, MessageSquare, Database, CreditCard, CheckCircle2 } from 'lucide-react';
import SeoHead from '../shared/SeoHead';

const features = [
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: 'WhatsApp Gateway API',
    description: 'Connect multiple WhatsApp instances simultaneously. Generate QR codes for pairing, manage connection states, and send/receive messages programmatically.',
    details: ['Multi-instance management', 'Real-time QR pairing', 'Connection status monitoring', 'Auto-reconnection on disconnect'],
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Full Messaging Suite',
    description: 'Send text, media (images, audio, video, documents), locations, contacts, reactions, and polls. Full support for both one-on-one and group messaging.',
    details: ['Text & media messages', 'Location & contact sharing', 'Group management', 'Message reactions & replies'],
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Token-Based Billing',
    description: 'Simple, transparent pricing. Purchase token packages via M-Pesa STK Push. Tokens never expire, and custom amounts are available.',
    details: ['M-Pesa STK Push integration', 'Custom token amounts', 'Welcome bonus for new accounts', 'Token transaction history'],
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: 'Developer-First REST API',
    description: 'A comprehensive REST API with proper authentication, rate limiting, and predictable response shapes. Full endpoint reference with code examples.',
    details: ['API key authentication', 'Webhook event support', 'OpenAPI specification', 'SDKs and code samples'],
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Real-Time Analytics',
    description: 'Track message delivery, usage trends, and daily volume from your dashboard. Platform-wide analytics for admins.',
    details: ['Daily message volume charts', 'Delivery rate tracking', 'Per-client usage breakdown', 'Admin platform overview'],
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Contact Management',
    description: 'Import and manage contacts with bulk CSV upload. Keep your contact lists organized with phone number validation.',
    details: ['CSV bulk import', 'Phone number validation', 'Contact segmentation', 'Import history tracking'],
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Secure & Reliable',
    description: 'Your messages and data are handled with care. HTTPS everywhere, API key authentication, and role-based access controls.',
    details: ['API key authentication', 'Secure webhook validation', 'GDPR/ Kenyan DPA compliant', 'Audit logs for admin actions'],
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Built for Kenya',
    description: 'Designed for Kenyan businesses with M-Pesa payments, local phone number support, and customer support in Nairobi.',
    details: ['M-Pesa integration', '+254 phone number support', 'Nairobi-based support', 'Kenyan data hosting options'],
  },
];

const techSpecs = [
  { label: 'Uptime', value: '99.9%' },
  { label: 'API Latency', value: '<200ms' },
  { label: 'Delivery Rate', value: 'Real-time' },
  { label: 'Kenyan Businesses', value: '5+' },
];

export default function FeaturesPage() {
  const [clientCount, setClientCount] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://whatsapp.fidscript.com/api/stats')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setClientCount(d.data.total_clients || 0);
          setDeliveryRate(d.data.delivery_rate || null);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
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

      <SeoHead
        title="Features — WhatsApp API Platform"
        description="Everything you need to build on WhatsApp: multi-instance gateway, REST API, M-Pesa billing, webhooks, contact management, analytics, and sandbox testing."
        canonical="/features"
        schema="features"
        breadcrumbs={[{ name: 'Features', url: '/features' }]}
      />
      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-dot-matrix opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-yellow-500/8 rounded-full blur-[128px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-semibold text-yellow-500">Platform Features</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
                Everything you need to build on <span className="text-yellow-500">WhatsApp</span>
              </h1>
              <p className="text-lg text-[#a8a594] max-w-2xl mx-auto mb-10">
                A complete WhatsApp API platform built for Kenyan businesses. From multi-instance management to M-Pesa billing — FIDScript handles the complexity so you can focus on your product.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  { label: 'Uptime', value: '99.9%' },
                  { label: 'API Latency', value: '<200ms' },
                  { label: 'Delivery Rate', value: deliveryRate !== null ? `${deliveryRate}%` : 'Real-time' },
                  { label: 'Kenyan Businesses', value: `${clientCount}+` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-[#8a886a]">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Platform Capabilities</h2>
              <p className="text-[#8a886a]">Everything implemented and running in production</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-[#11110a] border border-[#262413] rounded-2xl p-6 hover:border-[#3d3a1e] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base mb-2">{feature.title}</h3>
                      <p className="text-[#8a886a] text-sm mb-4 leading-relaxed">{feature.description}</p>
                      <ul className="space-y-1.5">
                        {feature.details.map(d => (
                          <li key={d} className="flex items-center gap-2 text-xs text-[#6a6c5d]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* API Preview */}
        <section className="py-16 md:py-20 bg-[#11110a] border-y border-[#262413]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Powerful REST API</h2>
                <p className="text-[#8a886a] mb-6 leading-relaxed">
                  A clean, predictable REST API with API key authentication, comprehensive error responses, and full endpoint coverage for messaging, groups, contacts, and profile management.
                </p>
                <div className="space-y-3">
                  {[
                    '10 message send types: text, media, location, contact, reaction, poll, sticker, audio, list, status',
                    'Webhook support for inbound messages and delivery receipts',
                    'OpenAPI specification available at /api/v1/openapi.json',
                    'Sandbox environment for testing without consuming tokens',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-[#a8a594]">
                      <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="bg-[#0c0b06] border border-[#262413] rounded-2xl p-5 font-mono text-xs overflow-x-auto">
                  <div className="text-[#6a6c5d] mb-3 text-[10px] uppercase tracking-wider">Example: Send Text Message</div>
                  <pre className="text-[#a8a594] whitespace-pre-wrap">{`curl -X POST https://whatsapp.fidscript.com/api/v1/sendText \\
  -H "X-API-Key: fidscript_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "instanceName": "my-business",
    "number": "254712345678",
    "text": "Hello from FIDScript!"
  }'`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-[#8a886a] mb-8">Join Kenyan businesses already using FIDScript to power their WhatsApp communications.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-sm rounded-xl transition-colors">
                Start Free Trial
              </Link>
              <Link to="/docs" className="px-8 py-4 bg-[#1b1910] hover:bg-[#262412] border border-[#383416] text-white font-semibold text-sm rounded-xl transition-colors">
                Read the Docs
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
