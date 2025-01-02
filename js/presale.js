console.log('presale.js 已加载');

// 初始化变量
let wallet = null;
const PRESALE_END_DATE = new Date('2024-02-01T00:00:00Z');
const SOFT_CAP = 1000;
const HARD_CAP = 2000;
const CURRENT_RAISED = 800;
const DSNK_PER_SOL = 10000;
const RPC_URL = 'https://black-lingering-fog.solana-mainnet.quiknode.pro/4d7783df09fe07db6ce511d870249fc3eb642683';

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
        const resp = await window.solana.connect({
            onlyIfTrusted: true,
            endpoint: RPC_URL
        });
        wallet = resp.publicKey.toString();
        
        // 更新UI
        const shortAddress = wallet.slice(0, 4) + '...' + wallet.slice(-4);
        const connectButton = document.getElementById('navConnectWallet');
        if (connectButton) {
            connectButton.textContent = shortAddress;
            console.log('按钮文本已更新为:', shortAddress);
        } else {
            console.error('未找到连接钱包按钮');
        }

        console.log('钱包连接成功:', shortAddress);
    } catch (err) {
        console.error('连接钱包失败:', err);
        alert('连接钱包失败，请重试');
    }
}

// 更新倒计时
function updateCountdown() {
    const now = new Date();
    const diff = PRESALE_END_DATE - now;

    if (diff <= 0) {
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.innerHTML = '<div>私募已结束</div>';
        }
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');

    if (daysElement) daysElement.textContent = String(days).padStart(2, '0');
    if (hoursElement) hoursElement.textContent = String(hours).padStart(2, '0');
    if (minutesElement) minutesElement.textContent = String(minutes).padStart(2, '0');
    if (secondsElement) secondsElement.textContent = String(seconds).padStart(2, '0');
}

// 更新进度条
function updateProgress() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progress = (CURRENT_RAISED / HARD_CAP) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// 初始化函数
function init() {
    console.log('初始化开始...');
    
    // 添加按钮点击事件
    const connectButton = document.getElementById('navConnectWallet');
    if (connectButton) {
        console.log('找到连接钱包按钮');
        connectButton.onclick = function(e) {
            e.preventDefault();
            console.log('按钮被点击');
            connectWallet();
        };
    } else {
        console.error('未找到连接钱包按钮');
    }

    // 启动倒计时
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 更新进度条
    updateProgress();

    console.log('初始化完成');
}

// 确保函数在全局范围内可用
window.connectWallet = connectWallet;

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 测试代码是否执行到底部
console.log('presale.js 执行完毕');
