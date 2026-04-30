'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'viem/chains';
import { useState, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

export function Providers({ children }: { children: ReactNode }) {
  const [config] = useState(() => 
    createConfig({
      chains: [base],
      connectors: [
        coinbaseWallet({
          appName: 'BaseAgent',
          preference: 'smartWalletOnly',
        }),
      ],
      transports: {
        [base.id]: http(),
      },
    })
  );

  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY ?? ''}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
