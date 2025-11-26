import { createConfig, http, fallback } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { SEPOLIA_RPC_URLS } from './constants';

const chains = [sepolia] as const;

// 여러 RPC 엔드포인트 설정
const sepoliaTransports = SEPOLIA_RPC_URLS.map((url) =>
  http(url, {
    timeout: 10000,
    retryCount: 2,
    retryDelay: 1000,
  })
);

// ✅ connector 한 개만: injected (MetaMask 등)
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [sepolia.id]: fallback(sepoliaTransports),
  },
});
