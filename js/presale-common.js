// 检测是否是移动端钱包浏览器
function isMobileWallet() {
    return (
        (globalThis.window?.solana && globalThis.window.solana.isPhantom) || 
        globalThis.window?.solflare ||
        globalThis.window?.okxwallet ||
        (globalThis.window?.tokenpocket && globalThis.window.tokenpocket.solana) ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(globalThis.navigator.userAgent)
    );
}

// 钱包状态管理
const walletState = {
    connected: false,
    address: '',
    balance: 0,
    provider: null
};

// 获取可用的钱包提供商
function getWalletProvider() {
    console.log('检测可用钱包...');
    console.log('Phantom:', !!globalThis.window?.solana?.isPhantom);
    console.log('OKX:', !!globalThis.window?.okxwallet);
    console.log('TokenPocket:', !!globalThis.window?.tokenpocket?.solana);
    console.log('Solflare:', !!globalThis.window?.solflare);

    if (globalThis.window?.solana?.isPhantom) {
        return { provider: globalThis.window.solana, name: 'Phantom' };
    }
    if (globalThis.window?.okxwallet) {
        try {
            if (!globalThis.window.okxwallet.solana) {
                globalThis.window.okxwallet.solana = globalThis.window.okxwallet;
            }
            return { provider: globalThis.window.okxwallet.solana, name: 'OKX' };
        } catch (err) {
            console.error('OKX钱包初始化失败:', err);
            return null;
        }
    }
    if (globalThis.window?.tokenpocket?.solana) {
        return { provider: globalThis.window.tokenpocket.solana, name: 'TokenPocket' };
    }
    if (globalThis.window?.solflare) {
        return { provider: globalThis.window.solflare, name: 'Solflare' };
    }
    return null;
}

// 钱包连接功能
async function connectWallet() {
    try {
        const walletInfo = getWalletProvider();
        
        // 检查是否有可用的钱包
        if (!walletInfo) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(globalThis.navigator.userAgent);
            if (isMobile) {
                showCustomAlert('请使用 Phantom、OKX 或 TP 钱包浏览器打开此页面', null);
            } else {
                showCustomAlert('请安装 Phantom、OKX 或 TP 钱包!', null);
                globalThis.window.open('https://phantom.app/', '_blank');
            }
            return;
        }

        // 如果已经连接，切换钱包信息显示
        if (walletState.connected) {
            toggleWalletInfo();
            return;
        }

        console.log('正在连接钱包:', walletInfo.name);

        // 根据不同钱包进行连接
        let walletAddress;
        if (walletInfo.name === 'OKX') {
            try {
                // OKX钱包特殊处理
                if (!walletInfo.provider.isConnected) {
                    await walletInfo.provider.connect();
                }
                const publicKey = walletInfo.provider.publicKey;
                if (!publicKey) {
                    throw new Error('获取钱包地址失败');
                }
                walletAddress = publicKey.toString();
                console.log('OKX钱包连接成功:', walletAddress);
            } catch (err) {
                console.error('OKX钱包连接失败:', err);
                showCustomAlert('连接OKX钱包失败: ' + err.message, null);
                return;
            }
        } else if (walletInfo.name === 'TokenPocket') {
            try {
                const response = await walletInfo.provider.connect();
                walletAddress = response.publicKey.toString();
            } catch (err) {
                console.error('TP钱包连接失败:', err);
                showCustomAlert('连接TP钱包失败: ' + err.message, null);
                return;
            }
        } else {
            try {
                const response = await walletInfo.provider.connect();
                walletAddress = response.publicKey.toString();
            } catch (err) {
                console.error('钱包连接失败:', err);
                showCustomAlert('连接钱包失败: ' + err.message, null);
                return;
            }
        }

        // 更新钱包状态
        walletState.connected = true;
        walletState.address = walletAddress;
        walletState.provider = walletInfo.provider;

        // 更新UI
        updateWalletUI();
        console.log('钱包连接成功:', walletAddress);

        // 添加断开连接的监听器
        walletInfo.provider.on('disconnect', () => {
            disconnectWallet();
            hideWalletInfo();
        });
        
        // 检查推荐人
        const referrer = getReferrer();
        if (referrer) {
            updateReferralDisplay(referrer);
        }
    } catch (err) {
        console.error('连接钱包失败:', err);
        showCustomAlert('连接钱包失败: ' + err.message, null);
    }
}

// 倒计时功能
function updateCountdown() {
    const now = new Date();
    const end = new Date(config.PRESALE_END);
    const diff = end - now;

    if (diff <= 0) {
        globalThis.document.getElementById('days').textContent = '00';
        globalThis.document.getElementById('hours').textContent = '00';
        globalThis.document.getElementById('minutes').textContent = '00';
        globalThis.document.getElementById('seconds').textContent = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    globalThis.document.getElementById('days').textContent = String(days).padStart(2, '0');
    globalThis.document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    globalThis.document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    globalThis.document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// 推荐链接功能
function getReferrer() {
    const urlParams = new globalThis.URLSearchParams(globalThis.window.location.search);
    const ref = urlParams.get('ref');
    return (ref && ref.length === 44) ? ref : null;
}

async function generateReferralLink() {
    try {
        if (!walletState.connected) {
            showCustomAlert('请先连接钱包', null);
            return;
        }

        const currentUrl = window.location.origin + window.location.pathname;
        const referralLink = `${currentUrl}?ref=${walletState.address}`;
        
        const referralInput = document.getElementById('referralLink');
        if (referralInput) {
            referralInput.value = referralLink;
            showCustomAlert('推荐链接已生成', null);
        }
    } catch (err) {
        console.error('生成推荐链接失败:', err);
        showCustomAlert('生成推荐链接失败', null);
    }
}

async function copyReferralLink() {
    const referralInput = document.getElementById('referralLink');
    if (!referralInput || !referralInput.value) {
        showCustomAlert('请先生成推荐链接', null);
        return;
    }

    try {
        await navigator.clipboard.writeText(referralInput.value);
        showCustomAlert('推荐链接已复制到剪贴板', null);
    } catch (err) {
        console.error('复制推荐链接失败:', err);
        // 回退方案
        referralInput.select();
        document.execCommand('copy');
        showCustomAlert('推荐链接已复制到剪贴板', null);
    }
}

// 钱包断开连接
async function disconnectWallet() {
    try {
        if (walletState.provider) {
            await walletState.provider.disconnect();
        }
        walletState.connected = false;
        walletState.address = '';
        walletState.provider = null;
        updateWalletUI();
        hideWalletInfo();
    } catch (err) {
        globalThis.console.error('断开钱包失败:', err);
        globalThis.alert('断开钱包失败: ' + err.message);
    }
}

// 切换钱包信息显示
function toggleWalletInfo() {
    try {
        if (!walletState.connected) return;
        
        const walletInfo = globalThis.document.getElementById('walletInfo');
        if (walletInfo) {
            walletInfo.classList.toggle('hidden');
        }
    } catch (err) {
        globalThis.console.error('切换钱包信息显示失败:', err);
    }
}

// 隐藏钱包信息
function hideWalletInfo() {
    try {
        const walletInfo = globalThis.document.getElementById('walletInfo');
        if (walletInfo) {
            walletInfo.classList.add('hidden');
        }
    } catch (err) {
        globalThis.console.error('隐藏钱包信息失败:', err);
    }
}

// 捐赠功能
async function contribute() {
    try {
        const walletInfo = getWalletProvider();
        
        // 检查钱包
        if (!walletInfo) {
            showCustomAlert('请先安装支持的钱包!', null);
            return;
        }

        // 检查钱包是否已连接
        if (!walletState.connected) {
            await connectWallet();
            if (!walletState.connected) {
                showCustomAlert('请先连接钱包!', null);
                return;
            }
        }

        const investAmount = document.getElementById('investAmount').value;
        if (!investAmount || parseFloat(investAmount) < 0.1) {
            showCustomAlert('请输入有效的 SOL 数量（最小 0.1 SOL）', null);
            return;
        }

        // 创建连接和交易
        const connection = new solanaWeb3.Connection(
            'https://black-lingering-fog.solana-mainnet.quiknode.pro/4d7783df09fe07db6ce511d870249fc3eb642683/',
            'confirmed'
        );
        const transaction = new solanaWeb3.Transaction();
        const wallet = walletInfo.provider;
        
        // 添加转账指令
        transaction.add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: new solanaWeb3.PublicKey(wallet.publicKey.toString()),
                toPubkey: new solanaWeb3.PublicKey(config.PRESALE_WALLET),
                lamports: Math.floor(parseFloat(investAmount) * solanaWeb3.LAMPORTS_PER_SOL)
            })
        );

        // 获取最新区块哈希（带重试逻辑）
        let blockhash;
        for (let i = 0; i < 3; i++) {
            try {
                const response = await connection.getLatestBlockhash();
                blockhash = response.blockhash;
                break;
            } catch (err) {
                console.error(`获取区块哈希失败，尝试次数 ${i + 1}/3:`, err);
                if (i === 2) {
                    throw new Error('获取区块哈希失败，请稍后再试');
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
            }
        }

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new solanaWeb3.PublicKey(wallet.publicKey.toString());

        // 发送交易
        let signature;
        try {
            const signedTx = await wallet.signAndSendTransaction(transaction);
            signature = signedTx.signature;
            console.log('交易已发送，等待确认...');
            
            // 等待交易确认（带重试逻辑）
            for (let i = 0; i < 3; i++) {
                try {
                    await connection.confirmTransaction(signature);
                    console.log('捐赠成功！交易签名:', signature);
                    showCustomAlert('捐赠成功！', null);
                    break;
                } catch (err) {
                    console.error(`确认交易失败，尝试次数 ${i + 1}/3:`, err);
                    if (i === 2) {
                        throw new Error('确认交易失败，但交易可能已经成功，请检查你的钱包');
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
                }
            }
        } catch (err) {
            console.error('捐赠失败:', err);
            showCustomAlert('捐赠失败: ' + err.message, null);
        }

        // 重置输入
        document.getElementById('investAmount').value = '';
        
        // 更新推荐人捐赠数量
        const referrer = getReferrer();
        if (referrer) {
            await updateReferralAmount(referrer, investAmount);
        }
    } catch (err) {
        console.error('捐赠失败:', err);
        showCustomAlert('捐赠失败: ' + err.message, null);
    }
}

// 计算代币数量
function calculateTokens(solAmount) {
    if (!solAmount) return 0;
    return solAmount * config.TDOGE_PER_SOL;
}

// UI更新函数
async function updateWalletUI() {
    try {
        const connectButton = globalThis.document.getElementById('connectWallet');
        const walletInfo = globalThis.document.getElementById('walletInfo');
        const walletAddress = globalThis.document.getElementById('walletAddress');
        const walletBalance = globalThis.document.getElementById('walletBalance');
        const contributeButton = globalThis.document.getElementById('contributeButton');
        const investAmount = globalThis.document.getElementById('investAmount');

        if (walletState.connected && walletState.address) {
            // 更新连接按钮状态
            if (connectButton) {
                connectButton.textContent = '已连接';
                connectButton.classList.add('connected');
            }
            
            // 初始状态下隐藏钱包信息，只在点击时显示
            if (walletInfo) {
                walletInfo.classList.add('hidden');
            }

            // 更新钱包地址（但保持隐藏状态）
            if (walletAddress) {
                const shortAddress = `${walletState.address.slice(0, 4)}...${walletState.address.slice(-4)}`;
                walletAddress.textContent = shortAddress;
            }

            // 更新钱包余额（但保持隐藏状态）
            if (walletBalance) {
                try {
                    const connection = new globalThis.window.solanaWeb3.Connection(config.RPC_URL);
                    const balance = await connection.getBalance(new globalThis.window.solanaWeb3.PublicKey(walletState.address));
                    walletState.balance = balance / 1e9;
                    walletBalance.textContent = `${walletState.balance.toFixed(4)} SOL`;
                } catch (err) {
                    globalThis.console.error('获取钱包余额失败:', err);
                }
            }

            // 启用捐赠功能
            if (investAmount) {
                investAmount.disabled = false;
                investAmount.placeholder = '最低 0.1 SOL';
            }
            if (contributeButton) {
                contributeButton.disabled = false;
                contributeButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }

            // 自动生成推荐链接
            generateReferralLink();
            
            // 获取并显示推荐奖励
            getReferralAmount();
        } else {
            // 重置连接按钮状态
            if (connectButton) {
                connectButton.textContent = '连接钱包';
                connectButton.classList.remove('connected');
            }

            // 隐藏钱包信息区域
            if (walletInfo) {
                walletInfo.classList.add('hidden');
            }

            // 禁用捐赠功能
            if (investAmount) {
                investAmount.disabled = true;
                investAmount.placeholder = '请先连接钱包';
            }
            if (contributeButton) {
                contributeButton.disabled = true;
                contributeButton.classList.add('opacity-50', 'cursor-not-allowed');
            }

            // 清空推荐链接
            const referralLinkElement = globalThis.document.getElementById('referralLink');
            if (referralLinkElement) {
                referralLinkElement.value = '';
            }
        }
    } catch (err) {
        globalThis.console.error('更新钱包UI失败:', err);
    }
}

// 自定义提示框函数
function showCustomAlert(message, buttonElement) {
    try {
        const alertDiv = globalThis.document.createElement('div');
        alertDiv.className = 'custom-alert';
        alertDiv.textContent = message;
        
        // 如果存在旧的提示框，先移除
        const oldAlert = globalThis.document.querySelector('.custom-alert');
        if (oldAlert) {
            oldAlert.remove();
        }
        
        globalThis.document.body.appendChild(alertDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    } catch (err) {
        globalThis.console.error('显示提示框失败:', err);
    }
}

// 检查钱包连接状态
globalThis.window.addEventListener('load', async () => {
    try {
        const provider = getWalletProvider();
        if (provider) {
            if (provider.provider.isPhantom) {
                const resp = await provider.provider.connect({ onlyIfTrusted: true });
                walletState.address = resp.publicKey.toString();
                walletState.connected = true;
                walletState.provider = provider.provider;
                updateWalletUI();
            }
        }
    } catch (err) {
        // 用户未授权连接，这是正常的
        globalThis.console.log("Wallet not connected:", err);
    }
});

// 检查当前钱包状态
async function checkWalletStatus() {
    try {
        const walletInfo = getWalletProvider();
        if (!walletInfo) {
            return;
        }

        let isConnected = false;
        let publicKey = null;

        if (walletInfo.name === 'OKX') {
            isConnected = walletInfo.provider.isConnected;
            publicKey = walletInfo.provider.publicKey;
        } else {
            isConnected = walletInfo.provider.isConnected;
            publicKey = walletInfo.provider.publicKey;
        }

        if (isConnected && publicKey) {
            walletState.connected = true;
            walletState.address = publicKey.toString();
            walletState.provider = walletInfo.provider;
            await updateWalletUI();
            console.log('钱包已连接:', walletState.address);
        }
    } catch (err) {
        console.error('检查钱包状态失败:', err);
    }
}

// 监听钱包断开连接
globalThis.window?.solana?.on('disconnect', () => {
    walletState.connected = false;
    walletState.address = '';
    walletState.provider = null;
    updateWalletUI();
});

// 点击其他地方时隐藏钱包信息
document.addEventListener('click', (event) => {
    const walletContainer = document.getElementById('walletContainer');
    const walletInfo = document.getElementById('walletInfo');
    
    if (!walletContainer.contains(event.target) && !walletInfo.classList.contains('hidden')) {
        hideWalletInfo();
    }
});

// 移动端钱包连接按钮处理
document.addEventListener('DOMContentLoaded', () => {
    const mobileConnectWallet = document.getElementById('mobileConnectWallet');
    const mobileWalletInfo = document.getElementById('mobileWalletInfo');
    const mobileWalletAddress = document.getElementById('mobileWalletAddress');
    const mobileDisconnectWallet = document.getElementById('mobileDisconnectWallet');

    // 显示移动端连接按钮
    if (mobileConnectWallet) {
        mobileConnectWallet.classList.remove('hidden');
    }

    // 移动端连接钱包
    if (mobileConnectWallet) {
        mobileConnectWallet.addEventListener('click', async () => {
            try {
                const wallet = await window.presaleCommon.connectWallet();
                if (wallet) {
                    mobileConnectWallet.classList.add('hidden');
                    mobileWalletInfo.classList.remove('hidden');
                    mobileWalletAddress.textContent = `${wallet.publicKey.toString().slice(0, 4)}...${wallet.publicKey.toString().slice(-4)}`;
                }
            } catch (error) {
                console.error('Mobile wallet connection error:', error);
            }
        });
    }

    // 移动端断开连接
    if (mobileDisconnectWallet) {
        mobileDisconnectWallet.addEventListener('click', async () => {
            try {
                await window.presaleCommon.disconnectWallet();
                mobileWalletInfo.classList.add('hidden');
                mobileConnectWallet.classList.remove('hidden');
            } catch (error) {
                console.error('Mobile wallet disconnection error:', error);
            }
        });
    }

    // 检查当前钱包状态
    checkWalletStatus();
});

// 查询推荐人的捐赠记录
async function getReferralAmount(referrerAddress) {
    try {
        const connection = new globalThis.window.solanaWeb3.Connection(config.RPC_URL);
        
        // 获取该地址的所有转账记录
        const signatures = await connection.getSignaturesForAddress(
            new globalThis.window.solanaWeb3.PublicKey(config.PRESALE_WALLET),
            { limit: 1000 }
        );
        
        let totalAmount = 0;
        
        // 遍历交易记录
        for (const sig of signatures) {
            const tx = await connection.getTransaction(sig.signature);
            if (!tx) continue;
            
            // 检查交易的memo数据,看是否包含推荐人信息
            const memoInstruction = tx.transaction.message.instructions.find(
                ix => ix.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
            );
            
            if (memoInstruction && memoInstruction.data === referrerAddress) {
                // 计算转账金额
                const transferInstruction = tx.transaction.message.instructions.find(
                    ix => ix.programId.toString() === '11111111111111111111111111111111'
                );
                
                if (transferInstruction) {
                    const lamports = transferInstruction.data.readBigInt64LE(0);
                    totalAmount += Number(lamports) / globalThis.window.solanaWeb3.LAMPORTS_PER_SOL;
                }
            }
        }
        
        return totalAmount;
        
    } catch (err) {
        console.error('获取推荐记录失败:', err);
        return 0;
    }
}

// 更新显示推荐总量
async function updateReferralDisplay(referrerAddress) {
    const amount = await getReferralAmount(referrerAddress);
    const referralAmountElement = document.getElementById('referralAmount');
    if (referralAmountElement) {
        referralAmountElement.textContent = `通过你的推荐链接捐赠的SOL: ${amount.toFixed(2)} SOL`;
    }
}

// 导出公共函数
globalThis.window.presaleCommon = {
    updateCountdown,
    connectWallet,
    disconnectWallet,
    contribute,
    calculateTokens,
    copyReferralLink,
    generateReferralLink,
    getReferralAmount,
    updateReferralDisplay,
    checkWalletStatus,
    updateWalletUI,
    isMobileWallet,
    showCustomAlert,
    setupWalletEventListeners
};

// 初始化事件监听器
function initializeEventListeners() {
    try {
        const connectWalletBtn = globalThis.document.getElementById('connectWallet');
        if (connectWalletBtn) {
            connectWalletBtn.removeEventListener('click', connectWallet);
            connectWalletBtn.addEventListener('click', connectWallet);
        }
        
        const copyLinkBtn = globalThis.document.getElementById('copyLink');
        if (copyLinkBtn) {
            copyLinkBtn.removeEventListener('click', copyReferralLink);
            copyLinkBtn.addEventListener('click', copyReferralLink);
        }
        
        const contributeBtn = globalThis.document.getElementById('contributeButton');
        if (contributeBtn) {
            contributeBtn.removeEventListener('click', contribute);
            contributeBtn.addEventListener('click', contribute);
        }
    } catch (err) {
        globalThis.console.error('初始化事件监听器失败:', err);
    }
}

// 页面加载时初始化
globalThis.window.addEventListener('DOMContentLoaded', () => {
    try {
        setupWalletEventListeners();
        checkWalletStatus();
        initializeEventListeners();
    } catch (err) {
        globalThis.console.error('初始化失败:', err);
    }
});

// 添加钱包事件监听
function setupWalletEventListeners() {
    if (globalThis.window.solana) {
        // 连接事件
        globalThis.window.solana.on('connect', () => {
            if (globalThis.window.solana.publicKey) {
                walletState.address = globalThis.window.solana.publicKey.toString();
                walletState.connected = true;
                walletState.provider = globalThis.window.solana;
                updateWalletUI();
            }
        });

        // 断开连接事件
        globalThis.window.solana.on('disconnect', () => {
            walletState.connected = false;
            walletState.address = '';
            walletState.provider = null;
            updateWalletUI();
        });

        // 账户变更事件
        globalThis.window.solana.on('accountChanged', () => {
            checkWalletStatus();
        });
    }
}

// 页面加载时初始化
globalThis.window.addEventListener('load', () => {
    setupWalletEventListeners();
    checkWalletStatus();
});
