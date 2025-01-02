import { PublicKey } from '@solana/web3.js'

export const validateInvestment = async (connection, wallet, amount) => {
  try {
    // 检查钱包是否连接
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error('请先连接钱包')
    }

    // 检查投资金额是否合法
    if (!amount || amount <= 0) {
      throw new Error('请输入有效的投资金额')
    }

    // 获取最小和最大投资限额
    const minInvestment = 0.1 // SOL
    const maxInvestment = 1000 // SOL
    
    if (amount < minInvestment) {
      throw new Error(`投资金额不能小于 ${minInvestment} SOL`)
    }
    
    if (amount > maxInvestment) {
      throw new Error(`投资金额不能大于 ${maxInvestment} SOL`)
    }

    // 检查钱包余额
    const balance = await connection.getBalance(wallet.publicKey)
    const solBalance = balance / 1e9 // 转换为 SOL

    if (solBalance < amount) {
      throw new Error(`余额不足，当前余额: ${solBalance.toFixed(4)} SOL`)
    }

    // 检查是否有足够的手续费（0.00001 SOL）
    if (solBalance < amount + 0.00001) {
      throw new Error('余额不足以支付交易手续费')
    }

    return true
  } catch (error) {
    throw error
  }
}

export const validateWallet = (wallet) => {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('请先连接钱包')
  }
  
  try {
    new PublicKey(wallet.publicKey)
    return true
  } catch (error) {
    throw new Error('无效的钱包地址')
  }
}
