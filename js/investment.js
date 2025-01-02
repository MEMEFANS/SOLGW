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
        const connection = new solanaWeb3.Connection('https://black-lingering-fog.solana-mainnet.quiknode.pro/4d7783df09fe07db6ce511d870249fc3eb642683');
        
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

// Handle SOL input validation
export function handleSolInput(event) {
    const input = event.target;
    let value = input.value;
    
    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 9 decimal places
    if (parts.length === 2 && parts[1].length > 9) {
        parts[1] = parts[1].substring(0, 9);
        value = parts[0] + '.' + parts[1];
    }
    
    input.value = value;
    
    // 更新DSNK数量显示
    const dsnkAmount = parseFloat(value || '0') * 10000;
    const dsnkDisplay = document.getElementById('dsnkAmount');
    if (dsnkDisplay) {
        dsnkDisplay.textContent = dsnkAmount.toLocaleString();
    }

    // 更新投资信息显示
    const investedInfo = document.getElementById('investedInfo');
    if (investedInfo) {
        const referrer = getReferrer();
        if (referrer && value) {
            const referralAmount = getReferralReward(parseFloat(value));
            investedInfo.textContent = `包含 ${referralAmount.toFixed(2)} SOL 推荐奖励`;
        } else {
            investedInfo.textContent = '';
        }
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

        // 项目方钱包地址
        const projectWallet = 'DogXxqbKjwnMFJGHBDGxYz1CvPVRkJogHVFJRMzFmKzj';
        console.log('Sending transaction to:', projectWallet); // 调试日志

        try {
            // 创建连接
            const connection = new solanaWeb3.Connection(
                'https://black-lingering-fog.solana-mainnet.quiknode.pro/4d7783df09fe07db6ce511d870249fc3eb642683',
                'confirmed'
            );
            console.log('Solana connection created'); // 调试日志

            // 创建交易
            const transaction = new solanaWeb3.Transaction();
            
            // 获取推荐人地址
            const referrer = getReferrer();
            console.log('Referrer:', referrer); // 调试日志

            // 计算项目方和推荐人的金额
            let projectAmount = solAmount;
            if (referrer && referrer !== provider.publicKey.toString()) {
                const referralAmount = getReferralReward(solAmount);
                projectAmount = solAmount - referralAmount;

                // 添加推荐奖励转账指令
                transaction.add(
                    solanaWeb3.SystemProgram.transfer({
                        fromPubkey: provider.publicKey,
                        toPubkey: new solanaWeb3.PublicKey(referrer),
                        lamports: Math.floor(referralAmount * solanaWeb3.LAMPORTS_PER_SOL)
                    })
                );
            }

            // 添加主要转账指令
            transaction.add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: provider.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(projectWallet),
                    lamports: Math.floor(projectAmount * solanaWeb3.LAMPORTS_PER_SOL)
                })
            );
            
            console.log('Transaction created'); // 调试日志

            // 获取最新区块哈希
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = provider.publicKey;
            
            console.log('Requesting signature...'); // 调试日志
            const { signature } = await provider.signAndSendTransaction(transaction);
            console.log('Transaction sent, signature:', signature); // 调试日志
            
            await connection.confirmTransaction(signature);
            console.log('Transaction confirmed'); // 调试日志

            alert('投资成功！\n交易签名: ' + signature);
            
            // 清空输入框
            if (input) {
                input.value = '';
                handleSolInput({ target: input });
            }
        } catch (err) {
            console.error('Transaction error:', err);
            throw new Error('交易失败: ' + (err.message || '未知错误'));
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
