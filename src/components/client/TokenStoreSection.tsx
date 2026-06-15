import React, { useState, useEffect } from 'react';
import { Wallet, History, Zap } from 'lucide-react';
import { paymentsApi } from '../../services/api';
import type { Client, TokenPackage } from '../../services/api';
import type { PaymentTransaction } from '../../services/payments';
import TabBtn from './tokenStore/TabBtn.js';
import BuyContent from './tokenStore/BuyContent.js';
import HistoryContent from './tokenStore/HistoryContent.js';
import { useTokenSSE } from './tokenStore/useTokenSSE.js';
import { useTokenPayments } from './tokenStore/useTokenPayments.js';

interface TokenStoreSectionProps {
  client: Client;
  tokenPackages: TokenPackage[];
  tokenBalance: number;
  onTokenBalanceChange: (b: number) => void;
  onTokenDeduct: (n: number) => void;
}

type ViewTab = 'buy' | 'history';

export default function TokenStoreSection({
  client,
  tokenPackages,
  onTokenBalanceChange,
}: TokenStoreSectionProps) {
  const [tab, setTab] = useState<ViewTab>('buy');
  const [selectedPkg, setSelectedPkg] = useState<TokenPackage | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customTokens, setCustomTokens] = useState(500);
  const [phone, setPhone] = useState(client.phone || '');
  const [txs, setTxs] = useState<PaymentTransaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  const {
    paying,
    payMsg,
    pendingRef,
    pendingCheckoutId,
    doPayPkg,
    doPayCustom,
    confirmMessage,
    setStatusMessage,
  } = useTokenPayments(phone);

  useTokenSSE({
    onBalance: onTokenBalanceChange,
    onPendingConfirmed: confirmMessage,
    hasPending: Boolean(pendingRef || pendingCheckoutId),
  });

  useEffect(() => {
    if (tab === 'history' && txs.length === 0) {
      setLoadingTxs(true);
      paymentsApi.getHistory().then(res => {
        if (res.success && res.data) setTxs(res.data);
      }).finally(() => setLoadingTxs(false));
    }
  }, [tab, txs.length]);

  const handlePayPkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPkg) doPayPkg(selectedPkg.id);
  };

  const handlePayCustom = (e: React.FormEvent) => {
    e.preventDefault();
    doPayCustom(customTokens);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-stone-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Token Store</h3>
              <p className="text-[11px] text-graphite">Buy tokens to send messages</p>
            </div>
          </div>
          {/* Tab toggle */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <TabBtn active={tab === 'buy'} onClick={() => setTab('buy')} icon={<Zap className="w-3.5 h-3.5" />} label="Buy" />
            <TabBtn active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="w-3.5 h-3.5" />} label="History" />
          </div>
        </div>

        {/* Body */}
        <div className="pt-5">
          {tab === 'buy' ? (
            <BuyContent
              tokenPackages={tokenPackages}
              selectedPkg={selectedPkg}
              onSelectPkg={setSelectedPkg}
              useCustom={useCustom}
              onToggleCustom={() => setUseCustom(!useCustom)}
              customTokens={customTokens}
              onCustomTokens={setCustomTokens}
              phone={phone}
              onPhone={setPhone}
              paying={paying}
              payMsg={payMsg}
              onPayPkg={handlePayPkg}
              onPayCustom={handlePayCustom}
              pendingRef={pendingRef}
              pendingCheckoutId={pendingCheckoutId}
              onPendingStatus={setStatusMessage}
            />
          ) : (
            <HistoryContent loading={loadingTxs} txs={txs} />
          )}
        </div>
      </div>
    </div>
  );
}
