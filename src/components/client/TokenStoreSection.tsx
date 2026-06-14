import React, { useState } from 'react';
import { Sparkles, CreditCard } from 'lucide-react';
import { paymentsApi } from '../../services/api';
import type { Client, TokenPackage } from '../../services/api';

interface TokenStoreSectionProps {
  client: Client;
  tokenPackages: TokenPackage[];
  tokenBalance: number;
  onTokenBalanceChange: (b: number) => void;
  onTokenDeduct: (n: number) => void;
}

export default function TokenStoreSection({
  client,
  tokenPackages,
  tokenBalance,
  onTokenBalanceChange,
  onTokenDeduct,
}: TokenStoreSectionProps) {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState(client.phone || '0746269657');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    setIsProcessingPayment(true);
    setPaymentStatus('Initiating M-Pesa payment...');

    try {
      const res = await paymentsApi.initiatePayment({ package_id: selectedPackage.id, phone_number: userPhoneNumber });
      if (res.success) {
        setPaymentStatus(`Payment initiated! M-Pesa prompt sent to ${userPhoneNumber}`);
        setTimeout(() => setPaymentStatus('Payment processing...'), 2000);
      } else {
        setPaymentStatus('Payment failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      setPaymentStatus('Payment error: ' + String(err));
    }
    setIsProcessingPayment(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-yellow-600" /> Token Packages</h3>
          <p className="text-xs text-graphite mt-0.5">Purchase tokens for WhatsApp messaging. 1 token = 1 text message.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tokenPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedPackage?.id === pkg.id ? 'border-yellow-500 bg-yellow-50/30 shadow-md' : 'border-stone-200 hover:border-yellow-400'
              }`}
              onClick={() => setSelectedPackage(pkg)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-500 uppercase">{pkg.name}</span>
                {pkg.bonus_tokens > 0 && (
                  <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full">+{pkg.bonus_tokens.toLocaleString()} BONUS</span>
                )}
              </div>
              <div className="text-2xl font-black text-forest-deep">{pkg.tokens.toLocaleString()}</div>
              <div className="text-xs text-stone-500 mb-3">tokens</div>
              <div className="text-lg font-bold text-yellow-700">KES {pkg.price_kes.toLocaleString()}</div>
              <div className="text-[10px] text-stone-400">KES {(pkg.price_kes / (pkg.tokens + pkg.bonus_tokens)).toFixed(2)} per token</div>
            </div>
          ))}
        </div>

        {selectedPackage && (
          <form onSubmit={handleInitiatePayment} className="bg-[#f9f9f2] border border-[#eaebe4] p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-forest-deep">Complete Purchase</h4>
                <p className="text-xs text-graphite">{selectedPackage.name} - {selectedPackage.tokens.toLocaleString()} tokens</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-800">KES {selectedPackage.price_kes}</div>
                <div className="text-xs text-stone-500">Total</div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">M-Pesa Phone Number</label>
              <input
                type="text"
                required
                placeholder="0740123456"
                value={userPhoneNumber}
                onChange={(e) => setUserPhoneNumber(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono text-sm"
              />
            </div>
            {paymentStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${paymentStatus.includes('failed') || paymentStatus.includes('error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                {paymentStatus}
              </div>
            )}
            <button
              type="submit"
              disabled={isProcessingPayment}
              className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#33301a] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 text-yellow-400" />
              <span>{isProcessingPayment ? 'Processing...' : `Pay KES ${selectedPackage.price_kes} via M-Pesa`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
