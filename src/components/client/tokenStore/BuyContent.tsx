import { TokenPackage } from '../../../services/api';
import { calcCost } from './constants.js';
import CustomCalc from './CustomCalc.js';
import PayForm from './PayForm.js';
import PendingPoller from './PendingPoller.js';

interface BuyContentProps {
  tokenPackages: TokenPackage[];
  selectedPkg: TokenPackage | null;
  onSelectPkg: (pkg: TokenPackage) => void;
  useCustom: boolean;
  onToggleCustom: () => void;
  customTokens: number;
  onCustomTokens: (n: number) => void;
  phone: string;
  onPhone: (v: string) => void;
  paying: boolean;
  payMsg: string;
  onPayPkg: (e: React.FormEvent) => void;
  onPayCustom: (e: React.FormEvent) => void;
  pendingRef: string;
  pendingCheckoutId: string;
  onPendingStatus: (status: string) => void;
}

export default function BuyContent({
  tokenPackages,
  selectedPkg,
  onSelectPkg,
  useCustom,
  onToggleCustom,
  customTokens,
  onCustomTokens,
  phone,
  onPhone,
  paying,
  payMsg,
  onPayPkg,
  onPayCustom,
  pendingRef,
  pendingCheckoutId,
  onPendingStatus,
}: BuyContentProps) {
  const customCost = calcCost(customTokens);

  return (
    <div className="space-y-5">
      {/* Package / custom toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide">Choose a Package</h4>
          <button
            onClick={onToggleCustom}
            className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            {useCustom ? 'Show fixed packages' : '+ Custom amount'}
          </button>
        </div>

        {!useCustom ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tokenPackages.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => onSelectPkg(pkg)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPkg?.id === pkg.id
                    ? 'border-yellow-500 bg-yellow-50/50 shadow-md'
                    : 'border-stone-200 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-stone-500 uppercase">{pkg.name}</span>
                  {pkg.bonus_tokens > 0 && (
                    <span className="bg-green-100 text-green-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      +{pkg.bonus_tokens} bonus
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-forest-deep">{pkg.tokens.toLocaleString()}{pkg.bonus_tokens > 0 && <span className="text-sm font-semibold text-green-600"> +{pkg.bonus_tokens.toLocaleString()}</span>}</div>
                <div className="text-[10px] text-stone-400 mb-2">tokens</div>
                <div className="text-sm font-bold text-yellow-700">KES {pkg.price_kes.toLocaleString()}</div>
                <div className="text-[9px] text-stone-400">KES {(pkg.price_kes / (pkg.tokens + pkg.bonus_tokens)).toFixed(2)}/token</div>
              </div>
            ))}
          </div>
        ) : (
          <CustomCalc tokens={customTokens} onTokens={onCustomTokens} cost={customCost} />
        )}
      </div>

      {/* Purchase form */}
      {selectedPkg && !useCustom && (
        <PayForm pkg={selectedPkg} phone={phone} onPhone={onPhone} paying={paying} msg={payMsg} onPay={onPayPkg} />
      )}
      {useCustom && (
        <PayForm
          pkg={{ id: 'custom', name: 'Custom', tokens: customTokens, price_kes: customCost.total, bonus_tokens: 0 }}
          phone={phone}
          onPhone={onPhone}
          paying={paying}
          msg={payMsg}
          onPay={onPayCustom}
          custom
        />
      )}
      {(pendingRef || pendingCheckoutId) && (
        <PendingPoller
          reference={pendingRef}
          checkoutId={pendingCheckoutId}
          onStatusChange={onPendingStatus}
        />
      )}
    </div>
  );
}
