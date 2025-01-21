// 配置
const config = {
    // Solana RPC 节点
    RPC_URL: 'https://black-lingering-fog.solana-mainnet.quiknode.pro/4d7783df09fe07db6ce511d870249fc3eb642683/',
    
    // 私募结束时间
    PRESALE_END: '2024-02-20T16:00:00.000Z',
    
    // 接收投资的钱包地址
    PRESALE_WALLET: 'BcXV94bgVxk49Fj5NPBwbN1D9ffxMmm6P7JHnfBsdTJ9',
    
    // 最小投资额
    MIN_INVESTMENT: 0.1,
    
    // 代币兑换比例 (45亿 TDOGE / 2000 SOL = 22.5万 TDOGE/SOL)
    TDOGE_PER_SOL: 225000,  // 每SOL可以获得的TDOGE数量

    // 代币总量
    TOTAL_SUPPLY: 10_000_000_000,
    
    // 私募比例
    PRESALE_PERCENTAGE: 45,
    
    // 私募目标（SOL）
    PRESALE_TARGET: 2_000
};

if (typeof globalThis !== 'undefined') {
    globalThis.window.config = config;
}
