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
                confirmTransactionInitialTimeout: 60000
            }
        );

        // 测试连接
        try {
            await connection.getVersion();
        } catch (error) {
            console.error('RPC连接测试失败:', error);
            throw new Error('无法连接到Solana网络，请稍后再试');
        }

        // 创建交易指令
        const instruction = globalThis.window.solanaWeb3.SystemProgram.transfer({
            fromPubkey: new globalThis.window.solanaWeb3.PublicKey(walletState.address),
            toPubkey: new globalThis.window.solanaWeb3.PublicKey(config.PRESALE_WALLET),
            lamports: Math.floor(amount * globalThis.window.solanaWeb3.LAMPORTS_PER_SOL)
        });

        // 创建交易
        const transaction = new globalThis.window.solanaWeb3.Transaction();
        transaction.add(instruction);

        // 获取最新的区块哈希
        let blockhash;
        try {
            const { blockhash: latestBlockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
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
                preflightCommitment: 'confirmed'
            });
            
            // 等待交易确认
            const latestBlockhash = await connection.getLatestBlockhash();
            
            const confirmationStrategy = {
                signature: signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            };
            
            try {
                const confirmation = await connection.confirmTransaction(confirmationStrategy);
                if (confirmation?.value?.err) {
                    console.log('交易已发送但确认状态未知，交易签名:', signature);
                    globalThis.alert('交易已发送！\n交易签名: ' + signature + '\n\n请在钱包中检查交易状态。');
                } else {
                    console.log('交易确认成功，交易签名:', signature);
                    globalThis.alert('投资成功！\n交易签名: ' + signature);
                }
            } catch (confirmError) {
                console.log('交易已发送但确认超时，交易签名:', signature);
                globalThis.alert('交易已发送！\n交易签名: ' + signature + '\n\n请在钱包中检查交易状态。');
            }
            
            // 重置表单
            investAmount.value = '';
            globalThis.document.getElementById('dsnkAmount').textContent = '0 DSNK';
            
        } catch (error) {
            console.error('交易发送失败:', error);
            throw new Error('交易发送失败，请检查钱包余额或网络状态');
        }
    } catch (error) {
        globalThis.console.error('投资失败:', error);
        globalThis.alert('投资失败: ' + error.message);
    }
}

// 计算代币数量
function calculateTokens(solAmount) {
    return solAmount * config.DSNK_PER_SOL;
}

// UI更新函数
function updateWalletUI() {
    const connectButton = globalThis.document.getElementById('connectWallet');
    const contributeForm = globalThis.document.getElementById('contributeForm');
    const referralLinkInput = globalThis.document.getElementById('referralLink');
    const walletInfo = globalThis.document.getElementById('walletInfo');
    const walletAddressElement = globalThis.document.getElementById('walletAddress');

    if (walletState.connected) {
        const shortAddress = `${walletState.address.slice(0, 4)}...${walletState.address.slice(-4)}`;
        connectButton.textContent = shortAddress;
        contributeForm.classList.remove('hidden');
        referralLinkInput.value = generateReferralLink(walletState.address);
        walletAddressElement.textContent = shortAddress;
    } else {
        connectButton.textContent = '连接钱包';
        contributeForm.classList.add('hidden');
        referralLinkInput.value = '请先连接钱包';
        walletInfo.classList.add('hidden');
    }
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

// 导出公共函数
globalThis.window.presaleCommon = {
    updateCountdown,
    connectWallet,
    disconnectWallet,
    copyReferralLink,
    contribute,
    calculateTokens
};
