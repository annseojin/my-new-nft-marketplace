'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { MyNFT } from '@/components/MyNFT';
import { Marketplace } from '@/components/Marketplace';
import { Profile } from '@/components/Profile';
import { ContractInfo } from '@/components/ContractInfo';
import { useState } from 'react';

type TabKey = 'marketplace' | 'mynft' | 'profile' | 'contracts';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'marketplace', label: '마켓플레이스' },
  { key: 'mynft', label: '내 NFT' },
  { key: 'profile', label: '내 프로필' },
  { key: 'contracts', label: '컨트랙트 정보' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('marketplace');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top gradient glow */}
      <div className="pointer-events-none fixed inset-x-0 -top-24 h-64 bg-gradient-to-b from-indigo-500/15 via-fuchsia-500/10 to-transparent blur-2xl dark:from-indigo-400/10 dark:via-fuchsia-400/10" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/75 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/65">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 flex items-center justify-center text-2xl select-none"
                  aria-label="App Logo"
                  title="NFT Marketplace"
                >
                  📦
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg sm:text-xl font-extrabold tracking-tight">
                    My NFT Marketplace
                  </h1>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    92212893 | 안서진
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <WalletConnect />
            </div>
          </div>

          {/* Tabs */}
          <div className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      'border',
                      active
                        ? 'border-transparent bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/40">
          <div className="p-4 sm:p-6">
            {activeTab === 'marketplace' && <Marketplace />}
            {activeTab === 'mynft' && <MyNFT />}
            {activeTab === 'profile' && <Profile />}
            {activeTab === 'contracts' && <ContractInfo />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200/60 bg-white/60 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sepolia 테스트넷에서 운영 중
            </p>

            {/* GitHub link */}
            <div className="flex items-center gap-2">
              {(() => {
                const GITHUB_URL =
                  'https://github.com/annseojin/my-new-nft-marketplace.git';
                return (
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm
                               text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition
                               dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                    title="GitHub Repository"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M12 .5C5.73.5.75 5.64.75 12.07c0 5.14 3.34 9.5 7.98 11.04.58.11.79-.26.79-.57 0-.28-.01-1.02-.02-2-3.25.72-3.94-1.6-3.94-1.6-.53-1.38-1.3-1.75-1.3-1.75-1.06-.75.08-.73.08-.73 1.17.08 1.79 1.24 1.79 1.24 1.04 1.83 2.72 1.3 3.39.99.11-.77.41-1.3.74-1.6-2.59-.3-5.31-1.33-5.31-5.93 0-1.31.45-2.38 1.19-3.22-.12-.3-.52-1.52.11-3.17 0 0 .97-.32 3.18 1.23.92-.27 1.91-.4 2.89-.4.98 0 1.97.13 2.89.4 2.21-1.55 3.18-1.23 3.18-1.23.63 1.65.23 2.87.11 3.17.74.84 1.19 1.91 1.19 3.22 0 4.61-2.73 5.62-5.33 5.92.42.37.79 1.1.79 2.22 0 1.6-.02 2.89-.02 3.28 0 .31.21.69.8.57 4.63-1.54 7.96-5.9 7.96-11.04C23.25 5.64 18.27.5 12 .5z" />
                    </svg>
                    <span className="font-semibold">GitHub</span>
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
