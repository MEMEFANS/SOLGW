import { config } from './config.js';
import { getProvider } from './wallet.js';
import { getReferrer, getReferralReward } from './referral.js';

// 发送交易
async function sendTransaction(provider, toAddress, amount) {
    try {
        // 确保金额是数字
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error('无效的金额');
        }

        // 创建连接
        const connection = new solanaWeb3.Connection(config.RPC_URL);
        
        // 创建交易
        const transaction = new solanaWeb3.Transaction();
        
        // 添加转账指令
        transaction.add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: new solanaWeb3.PublicKey(provider.publicKey.toString()),
                toPubkey: new solanaWeb3.PublicKey(toAddress),
                lamports: Math.floor(parsedAmount * solanaWeb3.LAMPORTS_PER_SOL)
            })
        );

        // 获取最新区块哈希
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new solanaWeb3.PublicKey(provider.publicKey.toString());

        // 发送交易请求
        const { signature } = await provider.signAndSendTransaction(transaction);
        
        // 等待交易确认
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error('交易确认失败');
        }

        return signature;
    } catch (error) {
        console.error('发送交易失败:', error);
        throw error;
    }
}

// 投资功能
export async function contribute() {
    console.log('Contribute function called'); // 调试日志

    // 检查 solana 对象
    if (typeof solanaWeb3 === 'undefined') {
        console.error('solanaWeb3 is not defined');
        alert('页面加载不完整，请刷新后重试');
        return;
    }

    // 禁用按钮防止重复点击
    const investButton = document.getElementById('investButton');
    if (investButton) {
        investButton.disabled = true;
        investButton.textContent = '处理中...';
    }

    try {
        console.log('Checking wallet...'); // 调试日志
        const provider = window?.solana;
        if (!provider) {
            throw new Error('请先安装 Phantom 钱包!');
        }

        console.log('Checking wallet connection...'); // 调试日志
        if (!provider.isConnected) {
            console.log('Wallet not connected, attempting to connect...'); // 调试日志
            try {
                await provider.connect();
                console.log('Wallet connected successfully'); // 调试日志
            } catch (err) {
                console.error('Wallet connection error:', err);
                throw new Error('连接钱包失败，请重试！');
            }
        }

        // 检查输入金额
        const input = document.getElementById('solAmount');
        const solAmount = input ? parseFloat(input.value) : 0;
        console.log('Input amount:', solAmount); // 调试日志
        
        if (!solAmount || solAmount < 0.1) {
            throw new Error('请输入有效的 SOL 数量（最小 0.1 SOL）');
        }

        // 检查余额
        const connection = new solanaWeb3.Connection(config.RPC_URL);
        const balance = await connection.getBalance(new solanaWeb3.PublicKey(provider.publicKey.toString()));
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
        
        if (solBalance < solAmount) {
            alert(`余额不足。\n当前余额: ${solBalance.toFixed(2)} SOL\n需要: ${solAmount.toFixed(2)} SOL`);
            return;
        }

        // 项目方钱包地址
        const projectWallet = config.WALLET_ADDRESS;
        console.log('Sending transaction to:', projectWallet); // 调试日志

        // 检查是否有推荐人
        const referrer = getReferrer();
        if (referrer && referrer !== provider.publicKey.toString()) {
            // 计算推荐奖励
            const referralReward = solAmount * 0.1; // 10% 推荐奖励
            
            // 创建两笔交易：一笔给项目方，一笔给推荐人
            const projectAmount = solAmount - referralReward;
            
            // 第一笔交易：给项目方
            await sendTransaction(provider, projectWallet, projectAmount);
            console.log('Project payment sent:', projectAmount);
            
            // 第二笔交易：给推荐人
            await sendTransaction(provider, referrer, referralReward);
            console.log('Referral reward sent:', referralReward);
            
            alert(`投资成功！\n项目方收到: ${projectAmount.toFixed(2)} SOL\n推荐人收到: ${referralReward.toFixed(2)} SOL`);
        } else {
            // 没有推荐人，全部金额给项目方
            const signature = await sendTransaction(provider, projectWallet, solAmount);
            console.log('Transaction signature:', signature);
            alert('投资成功！');
        }

        // 清空输入框
        if (input) {
            input.value = '';
            const event = new Event('input');
            input.dispatchEvent(event);
        }
    } catch (err) {
        console.error('Operation failed:', err);
        alert(err.message || '操作失败，请重试');
    } finally {
        // 恢复按钮状态
        if (investButton) {
            investButton.disabled = false;
            investButton.textContent = '确认私募';
        }
    }
}
