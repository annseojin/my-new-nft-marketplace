'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
  getListing,
  buyNFT,
  listNFT,
  cancelListing,
  approveNFT,
  approveToken,
  getTokenBalance,
  getTokenAllowance,
  getTokenDecimals,
  getTokenSymbol,
  formatTokenAmount,
  parseTokenAmount,
  ownerOf,
  getTokenURI,
} from '@/lib/contracts';
import { marketplaceContractAddress } from '@/lib/constants';
import { getIPFSGatewayUrl } from '@/lib/ipfs';

interface NFTListing {
  tokenId: bigint;
  price: bigint;
  seller: `0x${string}`;
  isListed: boolean;
  image?: string;
  name?: string;
}

type ToastType = 'success' | 'error' | 'info';

export function Marketplace() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  const [listings, setListings] = useState<NFTListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);

  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null);
  const [nftDetails, setNftDetails] = useState<{
    description?: string;
    attributes?: any[];
    owner?: string;
  } | null>(null);

  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [tokenSymbol, setTokenSymbol] = useState<string>('MTK');

  const [maxTokenId] = useState(100);
  const [status, setStatus] = useState<string>('');
  const [balanceError, setBalanceError] = useState<string>('');

  useEffect(() => setMounted(true), []);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        showToast('success', '복사 완료');
      } else {
        showToast('error', '복사 불가');
      }
    } catch {
      showToast('error', '복사 실패');
    }
  };

  const processBatch = async <T, R>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<R | null>
  ): Promise<R[]> => {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(processor));
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          results.push(result.value);
        }
      });
    }
    return results;
  };

  const convertIPFSUrl = (url: string): string => {
    if (url.startsWith('ipfs://')) {
      const hash = url.replace('ipfs://', '');
      return getIPFSGatewayUrl(hash);
    }
    return url;
  };

  const fetchMetadata = async (tokenURI: string) => {
    try {
      let url = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        const hash = tokenURI.replace('ipfs://', '');
        url = getIPFSGatewayUrl(hash);
      }

      const response = await fetch(url);
      if (!response.ok) return null;

      const metadata = await response.json();
      if (metadata.image) metadata.image = convertIPFSUrl(metadata.image);
      return metadata;
    } catch {
      return null;
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const tokenIds = Array.from({ length: maxTokenId + 1 }, (_, i) =>
        BigInt(i)
      );

      const listedTokens = await processBatch(
        tokenIds,
        20,
        async (tokenId): Promise<{ tokenId: bigint; listing: any } | null> => {
          try {
            const listing = await getListing(tokenId);
            if (listing.isListed) return { tokenId, listing };
          } catch {}
          return null;
        }
      );

      if (listedTokens.length === 0) {
        setListings([]);
        return;
      }

      const newListings = await Promise.all(
        listedTokens.map(async ({ tokenId, listing }) => {
          let image: string | undefined;
          let name: string | undefined;

          try {
            const tokenURI = await getTokenURI(tokenId);
            const metadata = await fetchMetadata(tokenURI);
            image = metadata?.image;
            name = metadata?.name;
          } catch {}

          return {
            tokenId,
            price: listing.price,
            seller: listing.seller,
            isListed: true,
            image,
            name,
          } as NFTListing;
        })
      );

      setListings(newListings);
    } catch (e) {
      console.error(e);
      setListings([]);
      showToast('error', '목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNFTDetails = async (listing: NFTListing) => {
    try {
      const tokenURI = await getTokenURI(listing.tokenId);
      const metadata = await fetchMetadata(tokenURI);
      const owner = await ownerOf(listing.tokenId);

      setNftDetails({
        description: metadata?.description,
        attributes: metadata?.attributes,
        owner,
      });
    } catch {
      setNftDetails(null);
    }
  };

  const handleNFTClick = async (listing: NFTListing) => {
    setSelectedNFT(listing);
    await fetchNFTDetails(listing);
  };

  const fetchTokenInfo = async () => {
    if (!isConnected || !address) return;

    try {
      const [decimals, symbol, balance] = await Promise.all([
        getTokenDecimals(),
        getTokenSymbol(),
        getTokenBalance(address).catch((err) => {
          setBalanceError(
            `잔액 조회 실패: ${err.message || '알 수 없는 오류'}`
          );
          return 0n;
        }),
      ]);

      setTokenDecimals(decimals);
      setTokenSymbol(symbol);
      setTokenBalance(balance);
      setBalanceError('');
    } catch (error: any) {
      setBalanceError(
        `토큰 정보 조회 실패: ${error.message || '알 수 없는 오류'}`
      );
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchListings();
      fetchTokenInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const handleBuy = async (tokenId: bigint, price: bigint) => {
    if (!isConnected || !address) {
      showToast('info', '지갑을 연결해주세요');
      return;
    }

    setIsTxPending(true);
    try {
      const allowance = await getTokenAllowance(
        address,
        marketplaceContractAddress as `0x${string}`
      );

      if (allowance < price) {
        setStatus('토큰 승인 중...');
        const approveReceipt = await approveToken(
          marketplaceContractAddress as `0x${string}`,
          price * 2n
        );
        setStatus(`토큰 승인 완료. TX: ${approveReceipt.transactionHash}`);
        showToast('success', '토큰 승인 완료');
      }

      setStatus('NFT 구매 중...');
      const receipt = await buyNFT(tokenId);
      setStatus(`구매 완료! TX: ${receipt.transactionHash}`);
      showToast('success', '구매 완료');

      await fetchListings();
      await fetchTokenInfo();

      setTimeout(() => setStatus(''), 4500);
    } catch (error: any) {
      console.error(error);
      setStatus(`구매 실패: ${error.message || '알 수 없는 오류'}`);
      showToast('error', '구매 실패');
      setTimeout(() => setStatus(''), 4500);
    } finally {
      setIsTxPending(false);
    }
  };

  const handleList = async (tokenId: bigint, price: string) => {
    if (!isConnected || !address) {
      showToast('info', '지갑을 연결해주세요');
      return;
    }

    setIsTxPending(true);
    try {
      const priceInWei = parseTokenAmount(price, tokenDecimals);

      setStatus('NFT 승인 중...');
      const approved = await approveNFT(
        marketplaceContractAddress as `0x${string}`,
        tokenId
      );
      setStatus(`NFT 승인 완료. TX: ${approved.transactionHash}`);
      showToast('success', 'NFT 승인 완료');

      setStatus('판매 등록 중...');
      const receipt = await listNFT(tokenId, priceInWei);
      setStatus(`판매 등록 완료! TX: ${receipt.transactionHash}`);
      showToast('success', '판매 등록 완료');

      await fetchListings();
      setTimeout(() => setStatus(''), 4500);
    } catch (error: any) {
      console.error(error);
      setStatus(`판매 등록 실패: ${error.message || '알 수 없는 오류'}`);
      showToast('error', '판매 등록 실패');
      setTimeout(() => setStatus(''), 4500);
    } finally {
      setIsTxPending(false);
    }
  };

  const handleCancel = async (tokenId: bigint) => {
    if (!isConnected || !address) {
      showToast('info', '지갑을 연결해주세요');
      return;
    }

    setIsTxPending(true);
    try {
      setStatus('판매 취소 중...');
      const receipt = await cancelListing(tokenId);
      setStatus(`판매 취소 완료! TX: ${receipt.transactionHash}`);
      showToast('success', '판매 취소 완료');

      await fetchListings();
      setTimeout(() => setStatus(''), 4500);
    } catch (error: any) {
      console.error(error);
      setStatus(`판매 취소 실패: ${error.message || '알 수 없는 오류'}`);
      showToast('error', '판매 취소 실패');
      setTimeout(() => setStatus(''), 4500);
    } finally {
      setIsTxPending(false);
    }
  };

  const filteredListings = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();

    return listings.filter((l) => {
      const mineOk = !onlyMine
        ? true
        : l.seller.toLowerCase() === address?.toLowerCase();

      const name = (l.name || '').toLowerCase();
      const idStr = l.tokenId.toString();

      const searchOk =
        kw.length === 0 ? true : name.includes(kw) || idStr.includes(kw);

      return mineOk && searchOk;
    });
  }, [listings, onlyMine, searchKeyword, address]);

  if (!mounted) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <p className="text-slate-600">로딩 중...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6 rounded-2xl border border-amber-200/60 bg-amber-50 text-amber-900">
        마켓플레이스를 사용하려면 먼저 지갑을 연결해주세요.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-[9999] rounded-2xl px-4 py-3 shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Loading overlay */}
        {(isLoading || isTxPending) && (
          <div className="fixed inset-0 bg-black/25 z-[9998] flex items-center justify-center">
            <div className="rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur px-5 py-4 shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin dark:border-slate-700 dark:border-t-white" />
                <p className="text-sm text-slate-800 dark:text-slate-100">
                  처리 중...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Token card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                내 토큰 잔액
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {formatTokenAmount(tokenBalance, tokenDecimals)} {tokenSymbol}
              </p>
              {tokenBalance === 0n && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Faucet에서 토큰을 받은 뒤 이용하세요.
                </p>
              )}
            </div>

            <button
              onClick={fetchTokenInfo}
              className="rounded-xl px-4 py-2 text-sm font-medium
                         bg-slate-900 text-white hover:bg-slate-800
                         dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              새로고침
            </button>
          </div>

          {balanceError && (
            <div className="px-5 pb-4">
              <p className="text-xs text-rose-600 dark:text-rose-400">
                ⚠️ {balanceError}
              </p>
            </div>
          )}
        </div>

        {/* Status bar */}
        {status && (
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="p-4 flex items-start justify-between gap-3">
              <p className="text-sm text-slate-700 dark:text-slate-200 break-all">
                {status}
              </p>

              {status.includes('TX:') && (
                <button
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium
                             border border-slate-200 bg-white hover:bg-slate-50
                             dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  onClick={() => {
                    const tx = status.split('TX:')[1]?.trim();
                    if (tx) copyToClipboard(tx);
                  }}
                >
                  TX 복사
                </button>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              마켓플레이스
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              검색/필터로 원하는 NFT를 빠르게 찾고, 토큰으로 구매하세요.
            </p>
          </div>

          <button
            onClick={() => {
              fetchListings();
              fetchTokenInfo();
            }}
            disabled={isLoading || isTxPending}
            className="rounded-xl px-4 py-2 text-sm font-medium
                       border border-slate-200 bg-white hover:bg-slate-50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            새로고침
          </button>
        </div>

        {/* Search / Filter toolbar */}
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="NFT 이름 또는 Token ID 검색"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300
                           dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-white/10"
              />
            </div>

            <label
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm
                              bg-white hover:bg-slate-50 cursor-pointer
                              dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
                className="accent-slate-900 dark:accent-white"
              />
              내 판매중만 보기
            </label>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              {filteredListings.length} / {listings.length}개 표시
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            판매 중인 NFT
          </h3>

          {filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-slate-600 dark:text-slate-300">
                조건에 맞는 NFT가 없습니다.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                검색어/필터를 바꾸거나 새로고침을 눌러보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((listing) => (
                <NFTCard
                  key={listing.tokenId.toString()}
                  listing={listing}
                  tokenDecimals={tokenDecimals}
                  tokenSymbol={tokenSymbol}
                  address={address}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                  onClick={() => handleNFTClick(listing)}
                  onCopy={copyToClipboard}
                  isBusy={isTxPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail modal */}
        {selectedNFT && (
          <NFTDetailModal
            listing={selectedNFT}
            details={nftDetails}
            onClose={() => {
              setSelectedNFT(null);
              setNftDetails(null);
            }}
            onBuy={handleBuy}
            onCancel={handleCancel}
            address={address}
            tokenDecimals={tokenDecimals}
            tokenSymbol={tokenSymbol}
            onCopy={copyToClipboard}
            isBusy={isTxPending}
          />
        )}
      </div>
    </div>
  );
}

function NFTCard({
  listing,
  tokenDecimals,
  tokenSymbol,
  address,
  onBuy,
  onCancel,
  onClick,
  onCopy,
  isBusy,
}: {
  listing: NFTListing;
  tokenDecimals: number;
  tokenSymbol: string;
  address?: `0x${string}`;
  onBuy: (tokenId: bigint, price: bigint) => void;
  onCancel: (tokenId: bigint) => void;
  onClick: () => void;
  onCopy: (text: string) => void;
  isBusy: boolean;
}) {
  const isOwner = listing.seller.toLowerCase() === address?.toLowerCase();

  return (
    <div
      className="group rounded-2xl border border-slate-200/60 bg-white shadow-sm
                 hover:shadow-md hover:-translate-y-[1px] transition
                 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
      onClick={onClick}
    >
      {listing.image ? (
        <img
          src={listing.image}
          alt={listing.name || `NFT #${listing.tokenId.toString()}`}
          className="h-48 w-full rounded-t-2xl object-cover bg-slate-100 dark:bg-slate-800"
        />
      ) : (
        <div className="h-48 w-full rounded-t-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {listing.name || `NFT #${listing.tokenId.toString()}`}
          </h4>

          {isOwner && (
            <span
              className="shrink-0 text-[11px] px-2 py-1 rounded-full
                             bg-emerald-50 text-emerald-700 border border-emerald-200
                             dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800"
            >
              내 판매중
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Token ID: {listing.tokenId.toString()}
          </p>
          <button
            className="text-[11px] rounded-lg px-2 py-1
                       border border-slate-200 bg-white hover:bg-slate-50
                       dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(listing.tokenId.toString());
            }}
          >
            ID 복사
          </button>
        </div>

        <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
          {formatTokenAmount(listing.price, tokenDecimals)} {tokenSymbol}
        </p>

        <div className="mt-4 flex gap-2">
          {isOwner ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(listing.tokenId);
              }}
              disabled={isBusy}
              className="flex-1 rounded-xl px-4 py-2 text-sm font-medium
                         bg-rose-600 text-white hover:bg-rose-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBuy(listing.tokenId, listing.price);
              }}
              disabled={isBusy}
              className="flex-1 rounded-xl px-4 py-2 text-sm font-medium
                         bg-slate-900 text-white hover:bg-slate-800
                         disabled:opacity-50 disabled:cursor-not-allowed
                         dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              구매
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="rounded-xl px-4 py-2 text-sm font-medium
                       border border-slate-200 bg-white hover:bg-slate-50
                       dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            상세
          </button>
        </div>
      </div>
    </div>
  );
}

function NFTDetailModal({
  listing,
  details,
  onClose,
  onBuy,
  onCancel,
  address,
  tokenDecimals,
  tokenSymbol,
  onCopy,
  isBusy,
}: {
  listing: NFTListing;
  details: { description?: string; attributes?: any[]; owner?: string } | null;
  onClose: () => void;
  onBuy: (tokenId: bigint, price: bigint) => void;
  onCancel: (tokenId: bigint) => void;
  address?: `0x${string}`;
  tokenDecimals: number;
  tokenSymbol: string;
  onCopy: (text: string) => void;
  isBusy: boolean;
}) {
  const isOwner = listing.seller.toLowerCase() === address?.toLowerCase();
  const getAddressUrl = (addr: string) =>
    `https://sepolia.etherscan.io/address/${addr}`;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {listing.name || `NFT #${listing.tokenId.toString()}`}
              </h2>
              {isOwner && (
                <span
                  className="text-xs px-2 py-1 rounded-full
                                 bg-emerald-50 text-emerald-700 border border-emerald-200
                                 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800"
                >
                  내 판매중
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-medium
                         border border-slate-200 bg-white hover:bg-slate-50
                         dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              닫기
            </button>
          </div>

          {listing.image && (
            <div className="mt-5">
              <img
                src={listing.image}
                alt={listing.name}
                className="w-full h-80 md:h-96 object-contain rounded-2xl bg-slate-50 dark:bg-slate-800"
              />
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Token ID
                  </p>
                  <p className="mt-1 font-mono text-slate-900 dark:text-slate-100">
                    {listing.tokenId.toString()}
                  </p>
                </div>
                <button
                  className="rounded-xl px-3 py-2 text-xs font-medium
                             border border-slate-200 bg-white hover:bg-slate-50
                             dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  onClick={() => onCopy(listing.tokenId.toString())}
                >
                  ID 복사
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  가격
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatTokenAmount(listing.price, tokenDecimals)}{' '}
                  {tokenSymbol}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                판매자
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="text-xs font-mono rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800 dark:text-slate-100">
                  {listing.seller}
                </code>
                <button
                  className="rounded-xl px-3 py-2 text-xs font-medium
                             border border-slate-200 bg-white hover:bg-slate-50
                             dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  onClick={() => onCopy(listing.seller)}
                >
                  주소 복사
                </button>
                <a
                  href={getAddressUrl(listing.seller)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl px-3 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800
                             dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Etherscan ↗
                </a>
              </div>

              {details?.owner && (
                <>
                  <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
                    현재 소유자
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="text-xs font-mono rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800 dark:text-slate-100">
                      {details.owner}
                    </code>
                    <button
                      className="rounded-xl px-3 py-2 text-xs font-medium
                                 border border-slate-200 bg-white hover:bg-slate-50
                                 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      onClick={() => onCopy(details.owner!)}
                    >
                      주소 복사
                    </button>
                  </div>
                </>
              )}
            </div>

            {details?.description && (
              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  설명
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {details.description}
                </p>
              </div>
            )}

            {details?.attributes && details.attributes.length > 0 && (
              <div className="rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  속성
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {details.attributes.map((attr: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/60 bg-slate-50 p-3
                                 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {attr.trait_type || '속성'}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {attr.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {isOwner ? (
              <button
                onClick={() => {
                  onCancel(listing.tokenId);
                  onClose();
                }}
                disabled={isBusy}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold
                           bg-rose-600 text-white hover:bg-rose-500
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                판매 취소
              </button>
            ) : (
              <button
                onClick={() => {
                  onBuy(listing.tokenId, listing.price);
                  onClose();
                }}
                disabled={isBusy}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold
                           bg-slate-900 text-white hover:bg-slate-800
                           disabled:opacity-50 disabled:cursor-not-allowed
                           dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                구매하기
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl px-4 py-3 text-sm font-semibold
                         border border-slate-200 bg-white hover:bg-slate-50
                         dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
