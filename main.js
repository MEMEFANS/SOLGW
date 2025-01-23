// 配置
const config = {
    DSNK_PER_SOL: 10000,
    PRESALE_WALLET: '2VC2dJeKApFyesXxdr5WpkiHhRnvpWPFcREmYX1SejdJ',
    PRESALE_END: '2024-02-01T00:00:00',
    MIN_INVESTMENT: 0.1
};

// 存储推荐人捐赠数据的对象
let referralData = {};

// 检查是否是移动端钱包浏览器
function isMobileWallet() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('tokenpocket') || 
           userAgent.includes('okx') || 
           userAgent.includes('metamask') ||
           userAgent.includes('trustwallet');
}

// 检查钱包状态
async function checkWalletStatus() {
    try {
        // 如果是移动端钱包浏览器
        if (isMobileWallet()) {
            if (window.solana) {
                const account = await window.solana.connect();
                handleWalletConnection(account.publicKey.toString());
                return;
            }
            // 如果是TP钱包
            if (window.sollet) {
                const account = await window.sollet.connect();
                handleWalletConnection(account.publicKey.toString());
                return;
            }
        } 
        // PC端Phantom钱包
        else if (window.phantom?.solana?.isConnected) {
            const publicKey = window.phantom.solana.publicKey;
            if (publicKey) {
                handleWalletConnection(publicKey.toString());
            }
        }
    } catch (err) {
        console.error('检查钱包状态失败:', err);
    }
}

// 处理钱包连接后的UI更新
function handleWalletConnection(address) {
    const connectWalletBtn = document.getElementById('connectWallet');
    const contributeForm = document.getElementById('contributeForm');
    
    if (connectWalletBtn && contributeForm) {
        connectWalletBtn.textContent = address.slice(0, 4) + '...' + address.slice(-4);
        connectWalletBtn.classList.add('connected');
        contributeForm.classList.remove('hidden');
    }
}

// 连接钱包
async function connectWallet() {
    try {
        console.log('尝试连接钱包...');
        
        // 移动端钱包浏览器
        if (isMobileWallet()) {
            if (window.solana) {
                const account = await window.solana.connect();
                handleWalletConnection(account.publicKey.toString());
                return;
            }
            if (window.sollet) {
                const account = await window.sollet.connect();
                handleWalletConnection(account.publicKey.toString());
                return;
            }
            alert('请使用支持的钱包浏览器');
            return;
        }
        
        // PC端Phantom钱包
        if (!window.phantom?.solana?.isPhantom) {
            alert('请先安装 Phantom 钱包!');
            window.open('https://phantom.app/', '_blank');
            return;
        }

        const resp = await window.phantom.solana.connect();
        handleWalletConnection(resp.publicKey.toString());
        
    } catch (err) {
        console.error('连接钱包失败:', err);
        alert('连接钱包失败: ' + err.message);
    }
}

// 捐赠
async function contribute() {
    try {
        // 检查钱包
        if (!window.phantom?.solana?.isPhantom && !isMobileWallet()) {
            alert('请先安装 Phantom 钱包!');
            return;
        }

        const solAmount = parseFloat(document.getElementById('solAmount').value);
        if (!solAmount || solAmount < 0.1) {
            alert('请输入有效的 SOL 数量（最小 0.1 SOL）');
            return;
        }

        // 创建连接和交易
        const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
        const transaction = new solanaWeb3.Transaction();
        let wallet;
        
        // 移动端钱包浏览器
        if (isMobileWallet()) {
            if (window.solana) {
                wallet = window.solana;
            } else if (window.sollet) {
                wallet = window.sollet;
            } else {
                alert('请使用支持的钱包浏览器');
                return;
            }
        } 
        // PC端Phantom钱包
        else {
            wallet = window.phantom.solana;
        }
        
        // 添加转账指令
        transaction.add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: new solanaWeb3.PublicKey(wallet.publicKey.toString()),
                toPubkey: new solanaWeb3.PublicKey(config.PRESALE_WALLET),
                lamports: solAmount * solanaWeb3.LAMPORTS_PER_SOL
            })
        );

        // 发送交易
        const signature = await wallet.signAndSendTransaction(transaction);
        
        // 等待交易确认
        const confirmation = await connection.confirmTransaction(signature.signature);
        
        if (confirmation.value.err === null) {
            // 交易成功，更新推荐人捐赠数量
            const referrer = localStorage.getItem('referrer');
            if (referrer) {
                updateReferralAmount(referrer, solAmount);
            }
            alert('捐赠成功！');
        } else {
            alert('交易失败，请重试');
        }
    } catch (err) {
        console.error('捐赠失败:', err);
        alert('捐赠失败: ' + err.message);
    }
}

// 更新推荐人捐赠数量
async function updateReferralAmount(referrer, amount) {
    if (!referralData[referrer]) {
        referralData[referrer] = 0;
    }
    referralData[referrer] += amount;
    
    // 更新UI显示
    const referralAmountElement = document.getElementById('referralAmount');
    if (referralAmountElement) {
        referralAmountElement.textContent = `Total SOL raised through your referral link: ${referralData[referrer].toFixed(2)} SOL`;
    }
    
    // TODO: 可以添加将数据保存到后端的逻辑
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
document.addEventListener('DOMContentLoaded', async function() {
    // 检查URL中的推荐人
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('ref');
    if (referrer) {
        localStorage.setItem('referrer', referrer);
    }

    // 初始化钱包
    await initializeWallet();
    
    // 设置定时刷新
    setInterval(updateCountdown, 1000);
});

// 生成推荐链接
async function generateReferralLink() {
    if (!window.phantom?.solana?.isPhantom && !isMobileWallet()) {
        showCustomAlert('Please connect your wallet first', document.getElementById('generateReferralButton'));
        return;
    }

    let walletAddress;
    if (isMobileWallet()) {
        if (window.solana) {
            walletAddress = await window.solana.connect();
        } else if (window.sollet) {
            walletAddress = await window.sollet.connect();
        } else {
            showCustomAlert('Please use a supported wallet browser', document.getElementById('generateReferralButton'));
            return;
        }
    } else {
        walletAddress = await getCurrentWalletAddress();
    }
    
    if (!walletAddress) {
        showCustomAlert('Failed to get wallet address', document.getElementById('generateReferralButton'));
        return;
    }

    try {
        const referralLinkInput = document.getElementById('referralLink');
        if (referralLinkInput) {
            // 使用固定的域名而不是 localhost
            const baseUrl = 'https://solgw.vercel.app';
            referralLinkInput.value = `${baseUrl}/?ref=${walletAddress}`;
            
            // 自动选中文本框内容
            referralLinkInput.select();
        }
    } catch (err) {
        console.error('生成推荐链接失败:', err);
        showCustomAlert('Failed to generate referral link', document.getElementById('generateReferralButton'));
    }
}

// 复制推荐链接
async function copyReferralLink() {
    const referralLinkInput = document.getElementById('referralLink');
    if (referralLinkInput) {
        try {
            await navigator.clipboard.writeText(referralLinkInput.value);
            showCustomAlert('Link copied!', document.getElementById('copyButton'));
        } catch (err) {
            console.error('复制链接失败:', err);
            showCustomAlert('Failed to copy link', document.getElementById('copyButton'));
        }
    }
}
