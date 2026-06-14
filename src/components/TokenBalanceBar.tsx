import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { Coins } from 'lucide-react';

interface TokenBalanceBarProps {
  balance: number;
  previousBalance?: number;
}

export default function TokenBalanceBar({ balance, previousBalance }: TokenBalanceBarProps) {
  const springValue = useSpring(balance, { stiffness: 100, damping: 30 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  const prevBalanceRef = useRef(balance);

  useEffect(() => {
    if (balance !== prevBalanceRef.current) {
      springValue.set(balance);
      prevBalanceRef.current = balance;
    }
  }, [balance, springValue]);

  const depleted = previousBalance !== undefined && balance < previousBalance;
  const depletedAmount = previousBalance !== undefined ? previousBalance - balance : 0;

  return (
    <div className="bg-gradient-to-r from-[#1f1d0b] via-[#2a2609] to-[#1f1d0b] border border-yellow-500/20 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] text-[#8f834a] font-bold uppercase tracking-wider">Token Balance</p>
            <div className="flex items-baseline gap-1">
              <motion.span
                className="text-2xl font-black text-yellow-400 font-mono"
              >
                {displayValue}
              </motion.span>
              <span className="text-[10px] text-[#6e684a] font-semibold">tokens</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          {depleted && depletedAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5"
            >
              <p className="text-[9px] text-red-400 font-bold uppercase">Depleted</p>
              <motion.p
                className="text-sm font-black text-red-400 font-mono"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                -{depletedAmount}
              </motion.p>
            </motion.div>
          )}
          {!depleted && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5">
              <p className="text-[9px] text-green-400 font-bold uppercase">Active</p>
              <p className="text-sm font-black text-green-400 font-mono">{balance > 0 ? 'OK' : 'EMPTY'}</p>
            </div>
          )}
        </div>
      </div>

      {balance < 100 && balance > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-yellow-500/10"
        >
          <p className="text-[10px] text-amber-400 font-semibold">
            Low balance warning! Consider purchasing more tokens to avoid service interruption.
          </p>
        </motion.div>
      )}

      {balance === 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-red-500/10"
        >
          <p className="text-[10px] text-red-400 font-semibold">
            Token balance exhausted. Please purchase tokens to continue sending messages.
          </p>
        </motion.div>
      )}
    </div>
  );
}