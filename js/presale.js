// 从配置文件导入配置
const config = {
    PRESALE_END_DATE: '2025-01-31T00:00:00Z',
    SOFT_CAP: 1000,
    HARD_CAP: 2000,
    DSNK_PER_SOL: 10000,
    RPC_URL: 'https://api.mainnet-beta.solana.com',
    WALLET_ADDRESS: 'BcXV94bgVxk49Fj5NPBwbN1D9ffxMmm6P7JHnfBsdTJ9'
};

console.log('presale.js 已加载');

// 初始化变量
let wallet = null;
const PRESALE_END_DATE = new Date(config.PRESALE_END_DATE);
const SOFT_CAP = config.SOFT_CAP;
const HARD_CAP = config.HARD_CAP;
const CURRENT_RAISED = 800;
const DSNK_PER_SOL = config.DSNK_PER_SOL;
const RPC_URL = config.RPC_URL;
const PRESALE_WALLET = config.WALLET_ADDRESS;

// 处理输入变化
function handleInput(event) {
    const input = event.target;
    let value = input.value;
    
    // 移除非数字和小数点
    value = value.replace(/[^\d.]/g, '');
    
    // 处理多个小数点
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // 如果第一个字符是小数点，添加前导零
    if (value.startsWith('.')) {
        value = '0' + value;
    }
    
    // 更新输入框值
    input.value = value;
    
    // 计算奖励
    const amount = parseFloat(value) || 0;
    const reward = amount * 0.1;
    document.getElementById('rewardAmount').textContent = reward.toFixed(2);
}

// 检查 Solana 对象是否存在
function checkSolana() {
    if (typeof window === 'undefined') return false;
    console.log('Checking Solana object:', window.solana);
    return window.solana && window.solana.isPhantom;
}

// 连接钱包函数
async function connectWallet() {
    console.log('connectWallet 函数被调用');
    
    try {
        // 检查是否安装了 Phantom 钱包
        if (!checkSolana()) {
            console.log('Phantom 钱包未安装');
            alert('请先安装 Phantom 钱包!');
            window.open('https://phantom.app/', '_blank');
            return;
        }

        console.log('尝试连接钱包...');
        // 请求连接钱包
        const resp = await window.solana.connect();
        wallet = resp.publicKey.toString();
        
        // 更新UI
        updateWalletUI();
        
        // 显示投资表单
        document.getElementById('contributeForm').classList.remove('hidden');
        document.getElementById('connectWallet').classList.add('hidden');

        console.log('钱包连接成功:', wallet);
    } catch (err) {
        console.error('连接钱包失败:', err);
        alert('连接钱包失败: ' + err.message);
    }
}

// 更新钱包UI
function updateWalletUI() {
    if (!wallet) return;
    
    const shortAddress = wallet.slice(0, 4) + '...' + wallet.slice(-4);
    const connectButtons = document.querySelectorAll('.wallet-connect-btn');
    connectButtons.forEach(button => {
        button.textContent = shortAddress;
    });
}

// 投资函数
async function contribute() {
    if (!wallet) {
        alert('请先连接钱包');
        return;
    }

    const amountInput = document.getElementById('investAmount');
    const amount = parseFloat(amountInput.value);

    // 检查输入是否有效
    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的投资金额');
        return;
    }

    // 检查最小投资额
    if (amount < 0.1) {
        alert('最小投资金额为 0.1 SOL');
        return;
    }

    try {
        // 获取钱包余额
        const connection = new solanaWeb3.Connection(RPC_URL);
        const publicKey = new solanaWeb3.PublicKey(wallet);
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / 1e9;

        console.log('当前钱包余额:', solBalance, 'SOL');
        console.log('投资金额:', amount, 'SOL');
        console.log('收款地址:', PRESALE_WALLET);

        // 检查余额是否足够（包括手续费）
        if (solBalance < amount + 0.01) {
            throw new Error(`余额不足。当前余额: ${solBalance.toFixed(3)} SOL，需要: ${amount} SOL（另需 0.01 SOL 手续费）`);
        }

        // 创建转账交易
        const transaction = new solanaWeb3.Transaction();
        
        // 添加转账指令
        transaction.add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new solanaWeb3.PublicKey(PRESALE_WALLET),
                lamports: Math.floor(amount * 1e9)
            })
        );

        // 获取最新的 blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // 发送交易前确认
        if (!confirm(`确认转账 ${amount} SOL 到私募地址：${PRESALE_WALLET}？`)) {
            throw new Error('用户取消交易');
        }

        // 发送交易
        const signed = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        console.log('交易已发送，等待确认...');
        console.log('交易签名:', signature);

        // 等待交易确认
        const confirmation = await connection.confirmTransaction(signature);
        if (confirmation.value && confirmation.value.err) {
            throw new Error('交易失败，请重试');
        }

        // 交易成功
        alert('投资成功！\n交易签名：' + signature + '\n可在 Solscan 查看：https://solscan.io/tx/' + signature);
        amountInput.value = '';
        
        // 更新进度条（这里应该从后端获取最新数据）
        updateProgress();

    } catch (error) {
        console.error('投资失败:', error);
        alert(error.message);
    }
}

// 更新倒计时
function updateCountdown() {
    const now = new Date().getTime();
    const distance = PRESALE_END_DATE - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// 更新进度条
function updateProgress() {
    const progress = (CURRENT_RAISED / HARD_CAP) * 100;
    const progressBar = document.querySelector('.progress-bar div');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// 初始化函数
function init() {
    // 检查钱包连接状态
    if (window.solana && window.solana.isPhantom) {
        try {
            window.solana.connect({ onlyIfTrusted: true })
                .then(resp => {
                    wallet = resp.publicKey.toString();
                    updateWalletUI();
                    document.getElementById('contributeForm').classList.remove('hidden');
                    document.getElementById('connectWallet').classList.add('hidden');
                })
                .catch(err => {
                    console.log('用户未授权连接');
                });
        } catch (err) {
            console.log('检查钱包状态失败:', err);
        }
    }

    // 添加输入事件监听
    const investInput = document.getElementById('investAmount');
    if (investInput) {
        investInput.addEventListener('input', handleInput);
    }
    
    // 添加投资按钮事件监听
    const contributeButton = document.getElementById('contributeButton');
    if (contributeButton) {
        contributeButton.addEventListener('click', contribute);
    }

    // 启动倒计时
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 更新进度条
    updateProgress();
}

// 确保函数在全局范围内可用
window.connectWallet = connectWallet;
window.contribute = contribute;

// 等待 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

console.log('presale.js 执行完毕');
