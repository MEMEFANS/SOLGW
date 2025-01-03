// 配置
const config = {
    DSNK_PER_SOL: 10000,
    PRESALE_WALLET: 'BcXV94bgVxk49Fj5NPBwbN1D9ffxMmm6P7JHnfBsdTJ9',
    PRESALE_END: '2024-02-01T00:00:00',
    MIN_INVESTMENT: 0.1
};

// 连接钱包
async function connectWallet() {
    try {
        console.log('尝试连接钱包...');
        
        // 检查是否安装了 Phantom 钱包
        if (!window.phantom?.solana?.isPhantom) {
            alert('请先安装 Phantom 钱包!');
            window.open('https://phantom.app/', '_blank');
            return;
        }

        // 连接钱包
        const resp = await window.phantom.solana.connect();
        console.log('钱包已连接:', resp.publicKey.toString());
        
        // 更新UI
        const connectWalletBtn = document.getElementById('connectWallet');
        const contributeForm = document.getElementById('contributeForm');
        
        if (connectWalletBtn && contributeForm) {
            const address = resp.publicKey.toString();
            connectWalletBtn.textContent = address.slice(0, 4) + '...' + address.slice(-4);
            connectWalletBtn.classList.add('hidden');
            contributeForm.classList.remove('hidden');
        }
    } catch (err) {
        console.error('连接钱包失败:', err);
        alert('连接钱包失败: ' + err.message);
    }
}

// 投资
async function contribute() {
    try {
        // 检查钱包
        if (!window.phantom?.solana?.isPhantom) {
            alert('请先安装 Phantom 钱包!');
            return;
        }

        const solAmount = document.getElementById('solAmount').value;
        if (!solAmount || solAmount < 0.1) {
            alert('请输入有效的 SOL 数量（最小 0.1 SOL）');
            return;
        }

        // 创建连接和交易
        const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
        const transaction = new solanaWeb3.Transaction();
        const wallet = window.phantom.solana;
        
        // 添加转账指令
        transaction.add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: new solanaWeb3.PublicKey(wallet.publicKey.toString()),
                toPubkey: new solanaWeb3.PublicKey('BcXV94bgVxk49Fj5NPBwbN1D9ffxMmm6P7JHnfBsdTJ9'),
                lamports: Math.floor(solAmount * solanaWeb3.LAMPORTS_PER_SOL)
            })
        );

        // 获取最新区块哈希
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new solanaWeb3.PublicKey(wallet.publicKey.toString());

        // 发送交易
        const { signature } = await wallet.signAndSendTransaction(transaction);
        console.log('交易已发送，等待确认...');
        
        await connection.confirmTransaction(signature);
        console.log('投资成功！交易签名:', signature);
        alert('投资成功！');
        
        // 重置输入
        document.getElementById('solAmount').value = '';
        updateDsnkAmount();
        
    } catch (err) {
        console.error('投资失败:', err);
        alert('投资失败: ' + err.message);
    }
}

// 更新 DSNK 数量显示
function updateDsnkAmount() {
    const solAmount = document.getElementById('solAmount').value || 0;
    const dsnkValue = solAmount * 10000;
    
    const dsnkAmount = document.getElementById('dsnkAmount');
    if (dsnkAmount) {
        dsnkAmount.textContent = dsnkValue.toLocaleString() + ' DSNK';
    }
    
    const rewardAmount = document.getElementById('rewardAmount');
    if (rewardAmount) {
        rewardAmount.textContent = (solAmount * 0.1).toFixed(2);
    }
}

// 更新倒计时
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

// 初始化
window.onload = () => {
    console.log('页面加载完成，开始初始化...');

    // 初始化倒计时
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 添加输入事件监听器
    const solAmountInput = document.getElementById('solAmount');
    if (solAmountInput) {
        solAmountInput.addEventListener('input', updateDsnkAmount);
    }

    // 添加事件监听器
    const connectWalletBtn = document.getElementById('connectWallet');
    if (connectWalletBtn) {
        connectWalletBtn.onclick = connectWallet;
    }

    const contributeBtn = document.getElementById('contributeButton');
    if (contributeBtn) {
        contributeBtn.onclick = contribute;
    }

    console.log('初始化完成');
};
