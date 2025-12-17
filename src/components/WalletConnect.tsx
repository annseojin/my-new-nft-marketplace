'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { SEPOLIA_CHAIN_ID } from '@/lib/constants';

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-28 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800" />
      </div>
    );
  }

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  const pill =
    'h-10 rounded-full px-4 text-sm font-semibold transition inline-flex items-center justify-center gap-2';
  const btnPrimary =
    pill +
    ' bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200';
  const btnSoft =
    pill +
    ' border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900';
  const btnDanger = pill + ' bg-rose-600 text-white hover:bg-rose-500';

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        {/* network badge */}
        <div
          className={[
            'hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold border',
            isSepolia
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200',
          ].join(' ')}
        >
          <span
            className={[
              'h-2 w-2 rounded-full',
              isSepolia ? 'bg-emerald-500' : 'bg-amber-500',
            ].join(' ')}
          />
          {isSepolia ? 'Sepolia' : 'Wrong Network'}
        </div>

        {!isSepolia && (
          <button
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
            className={btnPrimary}
          >
            Sepolia로 전환
          </button>
        )}

        <button
          onClick={() => navigator.clipboard?.writeText(address ?? '')}
          className={btnSoft}
          title="주소 복사"
        >
          <span className="font-mono">{shortAddr}</span>
          <span className="text-xs opacity-70">복사</span>
        </button>

        <button onClick={() => disconnect()} className={btnDanger}>
          연결 해제
        </button>
      </div>
    );
  }

  const preferred = connectors.find((c) =>
    c.name.toLowerCase().includes('meta')
  );

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => connect({ connector: preferred ?? connectors[0] })}
        disabled={isPending || connectors.length === 0}
        className={
          btnPrimary + ' disabled:opacity-50 disabled:cursor-not-allowed'
        }
      >
        {isPending ? '연결 중…' : '지갑 연결'}
      </button>

      {connectors.length > 1 && (
        <div className="hidden md:flex items-center gap-2">
          {connectors
            .filter((c) => c.uid !== (preferred?.uid ?? ''))
            .slice(0, 2)
            .map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                disabled={isPending}
                className={
                  btnSoft + ' disabled:opacity-50 disabled:cursor-not-allowed'
                }
              >
                {connector.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
