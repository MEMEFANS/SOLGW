const web3 = require("@solana/web3.js");

// 创建连接
const solana = new web3.Connection("https://black-lingering-fog.solana-mainnet.quiknode.pro/4d7783df09fe07db6ce511d870249fc3eb642683");

module.exports = {
    web3,
    connection: solana
};
