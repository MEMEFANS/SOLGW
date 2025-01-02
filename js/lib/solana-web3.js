// Constants
export const LAMPORTS_PER_SOL = 1000000000;

// Cluster API URL helper function
export function clusterApiUrl(cluster = 'mainnet-beta') {
    switch (cluster) {
        case 'mainnet-beta':
            return 'https://api.mainnet-beta.solana.com';
        case 'testnet':
            return 'https://api.testnet.solana.com';
        case 'devnet':
            return 'https://api.devnet.solana.com';
        default:
            throw new Error(`Unknown cluster: ${cluster}`);
    }
}
