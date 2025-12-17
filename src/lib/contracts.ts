import { parseUnits, formatUnits } from 'viem';
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from '@wagmi/core';
import { wagmiConfig } from './wagmi';
import {
  nftContractAddress,
  marketplaceContractAddress,
  tokenContractAddress,
  faucetContractAddress, 
} from './constants';

import nftAbi from './nftAbi.json';
import marketplaceAbi from './marketplaceAbi.json';
import tokenAbi from './tokenAbi.json';
import faucetAbi from './faucetAbi.json'; 

// ───────────────────────────────────────────────
// NFT 컨트랙트 함수들
// ───────────────────────────────────────────────
export async function mintNFT(to: `0x${string}`, tokenURI: string) {
  const hash = await writeContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'safeMint',
    args: [to, tokenURI],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

/**
 * 누구나 민팅(publicMint)
 * 컨트랙트에 publicMint(string tokenURI) 있어야 함
 */
export async function publicMintNFT(tokenURI: string) {
  const hash = await writeContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'publicMint',
    args: [tokenURI],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

export async function getTokenURI(tokenId: bigint): Promise<string> {
  const result = await readContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'tokenURI',
    args: [tokenId],
  });
  return result as string;
}

export async function ownerOf(tokenId: bigint): Promise<`0x${string}`> {
  const result = await readContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'ownerOf',
    args: [tokenId],
  });
  return result as `0x${string}`;
}

export async function balanceOf(owner: `0x${string}`): Promise<bigint> {
  const result = await readContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'balanceOf',
    args: [owner],
  });
  return result as bigint;
}

export async function getNFTOwner(): Promise<`0x${string}`> {
  const result = await readContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'owner',
  });
  return result as `0x${string}`;
}

export async function approveNFT(spender: `0x${string}`, tokenId: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'approve',
    args: [spender, tokenId],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

export async function setApprovalForAllNFT(
  spender: `0x${string}`,
  approved: boolean
) {
  const hash = await writeContract(wagmiConfig, {
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'setApprovalForAll',
    args: [spender, approved],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

// ───────────────────────────────────────────────
// 마켓플레이스 컨트랙트 함수들
// ───────────────────────────────────────────────
export async function listNFT(tokenId: bigint, price: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: marketplaceContractAddress as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'listNFT',
    args: [tokenId, price],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

export async function buyNFT(tokenId: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: marketplaceContractAddress as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'buyNFT',
    args: [tokenId],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

export async function cancelListing(tokenId: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: marketplaceContractAddress as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'cancelListing',
    args: [tokenId],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

export async function getListing(tokenId: bigint) {
  const result = (await readContract(wagmiConfig, {
    address: marketplaceContractAddress as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'getListing',
    args: [tokenId],
  })) as [bigint, `0x${string}`, boolean];

  return {
    price: result[0],
    seller: result[1],
    isListed: result[2],
  };
}

// ───────────────────────────────────────────────
// 토큰 컨트랙트 함수들 (MyToken)
// ───────────────────────────────────────────────
export async function approveToken(spender: `0x${string}`, amount: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: tokenContractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'approve',
    args: [spender, amount],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

export async function getTokenBalance(owner: `0x${string}`): Promise<bigint> {
  const result = await readContract(wagmiConfig, {
    address: tokenContractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: [owner],
  });
  return result as bigint;
}

export async function getTokenDecimals(): Promise<number> {
  try {
    const result = await readContract(wagmiConfig, {
      address: tokenContractAddress as `0x${string}`,
      abi: tokenAbi,
      functionName: 'decimals',
    });
    return Number(result);
  } catch {
    return 18;
  }
}

export async function getTokenSymbol(): Promise<string> {
  try {
    const result = await readContract(wagmiConfig, {
      address: tokenContractAddress as `0x${string}`,
      abi: tokenAbi,
      functionName: 'symbol',
    });
    return result as string;
  } catch {
    return 'MTK';
  }
}

export async function getTokenAllowance(
  owner: `0x${string}`,
  spender: `0x${string}`
): Promise<bigint> {
  const result = await readContract(wagmiConfig, {
    address: tokenContractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'allowance',
    args: [owner, spender],
  });
  return result as bigint;
}

export async function transferToken(to: `0x${string}`, amount: bigint) {
  const hash = await writeContract(wagmiConfig, {
    address: tokenContractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'transfer',
    args: [to, amount],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

// ───────────────────────────────────────────────
// Faucet (토큰 드랍) 컨트랙트 함수들
// ───────────────────────────────────────────────
export async function claimFromFaucet() {
  const hash = await writeContract(wagmiConfig, {
    address: faucetContractAddress as `0x${string}`,
    abi: faucetAbi,
    functionName: 'claim',
    args: [],
  });

  return await waitForTransactionReceipt(wagmiConfig, { hash });
}

// Faucet claim 여부 조회
export async function hasClaimedFromFaucet(
  user: `0x${string}`
): Promise<boolean> {
  const result = await readContract(wagmiConfig, {
    address: faucetContractAddress as `0x${string}`,
    abi: faucetAbi,
    functionName: 'claimed',
    args: [user],
  });

  return Boolean(result);
}

// ───────────────────────────────────────────────
// 유틸리티 함수
// ───────────────────────────────────────────────
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  return parseUnits(amount, decimals);
}

export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18
): string {
  return formatUnits(amount, decimals);
}
