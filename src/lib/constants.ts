export const tokenContractAddress =
  '0xA285f79E7c7F2874695f6b4d9E6DEc4d9c2d5288';
export const nftContractAddress = '0x172016FaD9984f009838e4017aF89C4305CCD26D';
export const marketplaceContractAddress =
  '0x11D6bf30557d4e1f05d09E609Fb440f51b31f267';
export const faucetContractAddress = '0xC1e51634D6c22414ad8d9cB568f801553735A1db';
export const SEPOLIA_CHAIN_ID = 11155111;

// Sepolia RPC 엔드포인트 (fallback 포함)
// 환경 변수로 커스텀 RPC URL을 설정할 수 있습니다
// NEXT_PUBLIC_SEPOLIA_RPC_URL이 설정되어 있으면 우선 사용하고, 없으면 fallback 사용
const customRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

export const SEPOLIA_RPC_URL = customRpcUrl || 'https://rpc.sepolia.org';

// 환경 변수가 설정되어 있으면 그것을 우선 사용하고, 추가 fallback 제공
export const SEPOLIA_RPC_URLS = customRpcUrl
  ? [
      customRpcUrl, // 사용자가 설정한 Infura API 키 포함 RPC URL (우선 사용)
      'https://rpc.sepolia.org', // fallback 1
      'https://ethereum-sepolia-rpc.publicnode.com', // fallback 2
      'https://rpc2.sepolia.org', // fallback 3
    ]
  : [
      'https://rpc.sepolia.org', // 기본값
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // 공개 Infura 엔드포인트
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc2.sepolia.org',
    ];

export const SEPOLIA_NETWORK = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};
