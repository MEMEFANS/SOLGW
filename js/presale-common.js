// 钱包状态管理
const walletState = {
    connected: false,
    address: '',
    balance: 0
};

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

function generateReferralLink(walletAddress) {
    if (!walletAddress) return '';
    const baseUrl = globalThis.window.location.href.split('?')[0];
    return `${baseUrl}?ref=${walletAddress}`;
}

async function copyReferralLink() {
    const referralLink = globalThis.document.getElementById('referralLink').value;
    if (referralLink && referralLink !== '请先连接钱包') {
        try {
            await globalThis.navigator.clipboard.writeText(referralLink);
            globalThis.alert('推荐链接已复制到剪贴板！');
        } catch (err) {
            globalThis.console.error('复制失败:', err);
            globalThis.alert('复制失败，请手动复制');
        }
    }
}

// 钱包连接功能
async function connectWallet() {
    if (walletState.connected) {
        toggleWalletInfo();
        return;
    }

    try {
        if (!globalThis.window.solana || !globalThis.window.solana.isPhantom) {
            globalThis.alert('请安装 Phantom 钱包!');
            globalThis.window.open('https://phantom.app/', '_blank');
            return;
        }

        const resp = await globalThis.window.solana.connect();
        walletState.address = resp.publicKey.toString();
        walletState.connected = true;
        
        updateWalletUI();
    } catch (err) {
        globalThis.console.error('连接钱包失败:', err);
        globalThis.alert('连接钱包失败: ' + err.message);
    }
}

// 断开钱包连接
async function disconnectWallet() {
    try {
        if (globalThis.window.solana) {
            await globalThis.window.solana.disconnect();
        }
        walletState.connected = false;
        walletState.address = '';
        updateWalletUI();
        hideWalletInfo();
    } catch (err) {
        globalThis.console.error('断开钱包失败:', err);
        globalThis.alert('断开钱包失败: ' + err.message);
    }
}

// 切换钱包信息显示
function toggleWalletInfo() {
    const walletInfo = document.getElementById('walletInfo');
    walletInfo.classList.toggle('hidden');
}

// 隐藏钱包信息
function hideWalletInfo() {
    const walletInfo = document.getElementById('walletInfo');
    walletInfo.classList.add('hidden');
}

// 投资功能
async function contribute() {
    if (!walletState.connected) {
        globalThis.alert('请先连接钱包');
        return;
    }

    const investAmount = globalThis.document.getElementById('investAmount');
    const amount = parseFloat(investAmount.value);
    if (isNaN(amount) || amount < config.MIN_INVESTMENT) {
        globalThis.alert(`请输入有效的投资金额（最小 ${config.MIN_INVESTMENT} SOL）`);
        return;
    }

    try {
        const provider = globalThis.window.solana;
        if (!provider) {
            throw new Error('请先安装 Phantom 钱包');
        }

        // 创建连接
        const connection = new globalThis.window.solanaWeb3.Connection(
            config.RPC_URL,
            {
                commitment: 'confirmed',
                wsEndpoint: config.RPC_URL.replace('https://', 'wss://'),
                confirmTransactionInitialTimeout: 120000
            }
        );

        // 测试连接并重试
        let connected = false;
        let retries = 3;
        while (!connected && retries > 0) {
            try {
                await connection.getVersion();
                connected = true;
            } catch (error) {
                console.error(`RPC连接测试失败，剩余重试次数: ${retries}`, error);
                retries--;
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        if (!connected) {
            throw new Error('无法连接到Solana网络，请稍后再试');
        }

        // 获取推荐人地址
        const referrer = getReferrer();
        const transaction = new globalThis.window.solanaWeb3.Transaction();

        // 创建主要转账指令
        const mainInstruction = globalThis.window.solanaWeb3.SystemProgram.transfer({
            fromPubkey: new globalThis.window.solanaWeb3.PublicKey(walletState.address),
            toPubkey: new globalThis.window.solanaWeb3.PublicKey(config.PRESALE_WALLET),
            lamports: Math.floor(amount * globalThis.window.solanaWeb3.LAMPORTS_PER_SOL)
        });
        
        // 如果有推荐人,添加memo指令记录推荐人地址
        if (referrer) {
            const memoInstruction = new globalThis.window.solanaWeb3.TransactionInstruction({
                keys: [],
                programId: new globalThis.window.solanaWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                data: globalThis.window.solanaWeb3.Buffer.from(referrer)
            });
            
            transaction.add(mainInstruction, memoInstruction);
        } else {
            transaction.add(mainInstruction);
        }

        // 获取最新的区块哈希
        let blockhash;
        try {
            const { blockhash: latestBlockhash } = await connection.getLatestBlockhash('finalized');
            blockhash = latestBlockhash;
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new globalThis.window.solanaWeb3.PublicKey(walletState.address);
        } catch (error) {
            console.error('获取区块哈希失败:', error);
            throw new Error('网络繁忙，请稍后再试');
        }

        // 发送交易
        let signature;
        try {
            const signed = await provider.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 3
            });

            // 显示处理中的提示
            showCustomAlert('交易处理中...', document.getElementById('contributeButton'));
            
            // 等待交易确认
            const latestBlockhash = await connection.getLatestBlockhash();
            const confirmationStrategy = {
                signature: signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            };
            
            try {
                const confirmation = await connection.confirmTransaction(confirmationStrategy, 'confirmed');
                
                if (confirmation?.value?.err) {
                    console.log('交易已发送但确认状态未知，交易签名:', signature);
                    const message = referrer ? 
                        `投资成功！通过推荐链接` :
                        `投资成功！`;
                    showCustomAlert(message, document.getElementById('contributeButton'));
                } else {
                    console.log('交易确认成功，交易签名:', signature);
                    const message = referrer ? 
                        `投资成功！通过推荐链接` :
                        `投资成功！`;
                    showCustomAlert(message, document.getElementById('contributeButton'));
                }
            } catch (err) {
                console.log('交易已发送但确认超时，交易签名:', signature);
                const message = referrer ? 
                    `投资成功！通过推荐链接` :
                    `投资成功！`;
                showCustomAlert(message, document.getElementById('contributeButton'));
            }
        } catch (error) {
            console.error('交易失败:', error);
            throw new Error('交易失败: ' + error.message);
        }
    } catch (err) {
        console.error('投资失败:', err);
        showCustomAlert('投资失败: ' + err.message, document.getElementById('contributeButton'));
    }
}

// 计算代币数量
function calculateTokens(solAmount) {
    return solAmount * config.TDOGE_PER_SOL;
}

// UI更新函数
async function updateWalletUI() {
    const connectBtn = document.getElementById('connectWallet');
    const disconnectBtn = document.getElementById('disconnectWallet');
    const walletAddress = document.getElementById('walletAddress');
    const walletInfo = document.getElementById('walletInfo');
    const mobileConnectBtn = document.getElementById('mobileConnectWallet');
    const mobileWalletInfo = document.getElementById('mobileWalletInfo');
    const mobileWalletAddress = document.getElementById('mobileWalletAddress');
    const investAmount = document.getElementById('investAmount');
    const contributeButton = document.getElementById('contributeButton');

    if (walletState.connected) {
        // 更新钱包地址显示
        const shortAddress = `${walletState.address.slice(0, 4)}...${walletState.address.slice(-4)}`;
        if (walletAddress) walletAddress.textContent = shortAddress;
        if (mobileWalletAddress) mobileWalletAddress.textContent = shortAddress;

        // 更新按钮状态
        if (connectBtn) connectBtn.querySelector('span').textContent = shortAddress;
        if (mobileConnectBtn) mobileConnectBtn.classList.add('hidden');
        if (mobileWalletInfo) mobileWalletInfo.classList.remove('hidden');

        // 启用投资输入
        if (investAmount) {
            investAmount.disabled = false;
            investAmount.placeholder = '最低 0.1 SOL';
        }
        if (contributeButton) {
            contributeButton.disabled = false;
            contributeButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        // 自动生成推荐链接
        const referralLink = `${window.location.origin}${window.location.pathname}?ref=${walletState.address}`;
        const referralLinkElement = document.getElementById('referralLink');
        if (referralLinkElement) {
            referralLinkElement.value = referralLink;
            // 更新显示当前钱包地址的推荐总量
            updateReferralDisplay(walletState.address);
        }
    } else {
        // 重置显示
        if (connectBtn) connectBtn.querySelector('span').textContent = '连接钱包';
        if (mobileConnectBtn) mobileConnectBtn.classList.remove('hidden');
        if (mobileWalletInfo) mobileWalletInfo.classList.add('hidden');
        if (walletInfo) walletInfo.classList.add('hidden');
        
        // 禁用投资输入
        if (investAmount) {
            investAmount.disabled = true;
            investAmount.placeholder = '请先连接钱包';
        }
        if (contributeButton) {
            contributeButton.disabled = true;
            contributeButton.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // 清空推荐链接
        const referralLinkElement = document.getElementById('referralLink');
        if (referralLinkElement) {
            referralLinkElement.value = '';
        }
        // 清空推荐总量显示
        const referralAmountElement = document.getElementById('referralAmount');
        if (referralAmountElement) {
            referralAmountElement.textContent = '通过你的推荐链接募集的SOL: 0 SOL';
        }
    }
}

// 自定义提示框函数
function showCustomAlert(message, buttonElement) {
    // 移除已存在的提示框
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // 创建提示框
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.textContent = message;

    // 获取按钮位置
    const buttonRect = buttonElement.getBoundingClientRect();

    // 设置提示框位置（在按钮上方）
    alert.style.left = `${buttonRect.left + (buttonRect.width - 200) / 2}px`;
    alert.style.top = `${buttonRect.top - 70}px`;

    // 添加到页面
    document.body.appendChild(alert);

    // 3秒后自动消失
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// 检查钱包连接状态
globalThis.window.addEventListener('load', async () => {
    try {
        const provider = globalThis.window.solana;
        if (provider) {
            if (provider.isPhantom) {
                const resp = await provider.connect({ onlyIfTrusted: true });
                walletState.connected = true;
                walletState.address = resp.publicKey.toString();
                updateWalletUI();
            }
        }
    } catch (err) {
        // 用户未授权连接，这是正常的
        globalThis.console.log("Wallet not connected:", err);
    }
});

// 监听钱包断开连接
globalThis.window?.solana?.on('disconnect', () => {
    walletState.connected = false;
    walletState.address = '';
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
    const checkWalletStatus = async () => {
        try {
            const wallet = await window.solana?.connect({ onlyIfTrusted: true });
            if (wallet) {
                mobileConnectWallet.classList.add('hidden');
                mobileWalletInfo.classList.remove('hidden');
                mobileWalletAddress.textContent = `${wallet.publicKey.toString().slice(0, 4)}...${wallet.publicKey.toString().slice(-4)}`;
            }
        } catch (error) {
            console.log('No trusted wallet connection');
        }
    };

    // 页面加载时检查钱包状态
    checkWalletStatus();
});

// 查询推荐人的私募记录
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
        referralAmountElement.textContent = `通过你的推荐链接募集的SOL: ${amount.toFixed(2)} SOL`;
    }
}

// 生成推荐链接
async function generateReferralLink() {
    if (!walletState.connected) {
        showCustomAlert('请先连接钱包', document.getElementById('generateReferralBtn'));
        return;
    }

    const referralLink = `${globalThis.window.location.origin}${globalThis.window.location.pathname}?ref=${walletState.address}`;
    const referralLinkElement = document.getElementById('referralLink');
    if (referralLinkElement) {
        referralLinkElement.value = referralLink;
        
        // 更新显示当前钱包地址的推荐总量
        await updateReferralDisplay(walletState.address);
    }
}

// 导出公共函数
globalThis.window.presaleCommon = {
    updateCountdown,
    connectWallet,
    disconnectWallet,
    copyReferralLink,
    generateReferralLink,
    contribute,
    calculateTokens,
    getReferralAmount,
    updateReferralDisplay
};

// 页面加载时加载推荐数据
document.addEventListener('DOMContentLoaded', () => {
    // loadReferralData();
});
