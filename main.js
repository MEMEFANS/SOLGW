function updateDsnkAmount() {
    // 获取输入的 SOL 数量
    const solAmount = document.getElementById('solAmount').value || 0;
    // 计算 DSNK 数量
    const dsnkValue = solAmount * 10000;
    
    // 更新 DSNK 显示
    const dsnkAmount = document.getElementById('dsnkAmount');
    dsnkAmount.textContent = dsnkValue.toLocaleString();
    
    // 更新投资信息显示
    const investInfo = document.querySelector('.text-sm.text-gray-400');
    if (investInfo) {
        // 检查是否有投资记录
        const investedAmount = localStorage.getItem('investedAmount');
        if (investedAmount) {
            const investedDsnk = investedAmount * 10000;
            investInfo.innerHTML = `已投资：${investedAmount} SOL = ${investedDsnk.toLocaleString()} DSNK`;
        } else {
            investInfo.innerHTML = ''; // 如果没有投资，不显示信息
        }
    }
}

async function contribute() {
    try {
        // 获取 Phantom 钱包提供者
        const provider = window.getProvider();
        if (!provider) {
            alert('请先安装 Phantom 钱包!');
            return;
        }

        // 连接钱包
        try {
            const resp = await provider.connect();
            console.log('Wallet connected:', resp.publicKey.toString());
        } catch (err) {
            console.error('连接钱包失败:', err);
            return;
        }

        // 检查输入金额
        const solAmount = document.getElementById('solAmount').value;
        if (!solAmount || solAmount < 0.1) {
            alert('请输入有效的 SOL 数量（最小 0.1 SOL）');
            return;
        }

        // 转账目标地址
        const PRESALE_WALLET = 'BcXV94bgVxk49Fj5NPBwbN1D9ffxMmm6P7JHnfBsdTJ9';

        try {
            // 创建连接 (使用 QuickNode RPC URL)
            const connection = new solanaWeb3.Connection('https://black-lingering-fog.solana-mainnet.quiknode.pro/4d7783df09fe07db6ce511d870249fc3eb642683');
            
            // 创建交易
            const transaction = new solanaWeb3.Transaction();
            
            // 添加转账指令
            transaction.add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: new solanaWeb3.PublicKey(provider.publicKey.toString()),
                    toPubkey: new solanaWeb3.PublicKey(PRESALE_WALLET),
                    lamports: Math.floor(solAmount * solanaWeb3.LAMPORTS_PER_SOL)
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

            // 保存投资记录
            const previousAmount = parseFloat(localStorage.getItem('investedAmount') || 0);
            const newAmount = previousAmount + parseFloat(solAmount);
            localStorage.setItem('investedAmount', newAmount.toString());
            updateDsnkAmount();
             
            console.log('Transaction successful! Signature:', signature);
            alert('转账成功！');
        } catch (err) {
            console.error('转账失败:', err);
            alert('交易失败: ' + err.message);
        }
    } catch (err) {
        console.error('转账失败:', err);
        alert('交易失败: ' + err.message);
    }
}

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    window.getProvider = () => {
        if ('phantom' in window) {
            const provider = window.phantom?.solana;

            if (provider?.isPhantom) {
                return provider;
            }
        }

        window.open('https://phantom.app/', '_blank');
    };

    // 钱包连接状态
    let walletConnected = false;
    let walletAddress = '';

    // 显示钱包地址的简短版本
    function shortenAddress(address) {
        return address.slice(0, 4) + '...' + address.slice(-4);
    }

    // 切换钱包下拉菜单
    function toggleWalletDropdown() {
        const dropdown = document.getElementById('walletDropdown');
        dropdown.classList.toggle('hidden');
    }

    // 连接钱包
    document.getElementById('navConnectWallet').addEventListener('click', async () => {
        if (walletConnected) {
            toggleWalletDropdown();
            return;
        }

        try {
            const provider = window?.solana;
            if (!provider) {
                alert('请安装 Solana 钱包!');
                return;
            }

            const resp = await provider.connect();
            walletAddress = resp.publicKey.toString();
            walletConnected = true;
            
            // 更新按钮文本为钱包地址
            const connectButton = document.getElementById('navConnectWallet');
            connectButton.textContent = shortenAddress(walletAddress);
            connectButton.classList.add('connected');
        } catch (err) {
            console.error(err);
            alert('连接钱包失败!');
        }
    });

    // 断开钱包连接
    document.getElementById('disconnectWallet').addEventListener('click', async () => {
        try {
            const provider = window?.solana;
            if (provider) {
                await provider.disconnect();
            }
            walletConnected = false;
            walletAddress = '';
            
            // 重置按钮文本
            const connectButton = document.getElementById('navConnectWallet');
            connectButton.textContent = '连接钱包';
            connectButton.classList.remove('connected');
            
            // 隐藏下拉菜单
            document.getElementById('walletDropdown').classList.add('hidden');
        } catch (err) {
            console.error(err);
            alert('断开连接失败!');
        }
    });

    // 点击其他地方时关闭下拉菜单
    document.addEventListener('click', (event) => {
        const walletContainer = document.querySelector('.wallet-container');
        const dropdown = document.getElementById('walletDropdown');
        
        if (!walletContainer.contains(event.target) && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    });

    // 倒计时功能
    function updateCountdown() {
        const endDate = new Date('2024-02-01T00:00:00');
        const now = new Date();
        const diff = endDate - now;

        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = days;
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        }
    }

    // 每秒更新倒计时
    setInterval(updateCountdown, 1000);
    updateCountdown(); // 初始化显示

    // 添加事件监听器
    document.getElementById('solAmount').addEventListener('input', updateDsnkAmount);
    document.getElementById('contributeButton').addEventListener('click', contribute);

    // 初始化显示
    updateDsnkAmount();
});
