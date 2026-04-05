import { createConfig, http } from 'wagmi';
import { mainnet, polygon, base, sepolia, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';

export const web3Config = createConfig(
    getDefaultConfig({
        // Your dApp's chains
        chains: [mainnet, polygon, base, sepolia, baseSepolia],
        transports: {
            [mainnet.id]: http(),
            [polygon.id]: http(),
            [base.id]: http(),
            [sepolia.id]: http(),
            [baseSepolia.id]: http(),
        },

        // Required API Keys
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dummy_id',

        // Required App Info
        appName: 'StudentHire',

        // Optional App Info
        appDescription: 'Direct student hiring platform with secure payments.',
        appUrl: 'https://studenthire.example',
    })
);
