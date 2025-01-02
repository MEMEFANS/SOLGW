import { updateReferralLink } from './referral.js';

// 钱包连接状态
const wallet = {
    connected: false,
    address: ''
};

// 显示钱包地址的简短版本
function shortenAddress(address) {
    return address.slice(0, 4) + '...' + address.slice(-4);
}

// 切换钱包下拉菜单
function toggleWalletDropdown() {
    const dropdown = document.getElementById('walletDropdown');
    dropdown.classList.toggle('hidden');
}

// 更新钱包按钮显示
function updateWalletButton() {
    const connectButton = document.getElementById('navConnectWallet');
    const dropdown = document.getElementById('walletDropdown');
    
    if (wallet.connected && wallet.address) {
        connectButton.textContent = shortenAddress(wallet.address);
        dropdown.classList.remove('hidden');
        // 更新推荐链接
        updateReferralLink(wallet.address);
    } else {
        connectButton.textContent = '连接钱包';
        dropdown.classList.add('hidden');
        // 清除推荐链接
        updateReferralLink(null);
    }
}

// 获取钱包提供者
export function getProvider() {
    if ('phantom' in window) {
        const provider = window.phantom?.solana;

        if (provider?.isPhantom) {
            return provider;
        }
    }
    window.open('https://phantom.app/', '_blank');
    return null;
}

// 连接钱包
export async function connectWallet() {
    if (wallet.connected) {
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
        wallet.address = resp.publicKey.toString();
        wallet.connected = true;
        
        // 更新按钮文本为钱包地址
        const connectButton = document.getElementById('navConnectWallet');
        connectButton.textContent = shortenAddress(wallet.address);
        connectButton.classList.add('connected');
        
        // 更新推荐链接
        updateReferralLink(wallet.address);
    } catch (err) {
        console.error(err);
        alert('连接钱包失败!');
    }
}

// 断开钱包连接
export async function disconnectWallet() {
    try {
        const provider = window?.solana;
        if (provider) {
            await provider.disconnect();
        }
        wallet.connected = false;
        wallet.address = '';
        
        // 重置按钮文本
        const connectButton = document.getElementById('navConnectWallet');
        connectButton.textContent = '连接钱包';
        connectButton.classList.remove('connected');
        
        // 隐藏下拉菜单
        document.getElementById('walletDropdown').classList.add('hidden');
        
        // 清除推荐链接
        updateReferralLink(null);
    } catch (err) {
        console.error(err);
        alert('断开连接失败!');
    }
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 点击其他地方时关闭下拉菜单
    document.addEventListener('click', (event) => {
        const walletContainer = document.querySelector('.wallet-container');
        const dropdown = document.getElementById('walletDropdown');
        
        if (!walletContainer.contains(event.target) && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    });

    // 连接钱包按钮
    document.getElementById('navConnectWallet').addEventListener('click', connectWallet);
    
    // 断开连接按钮
    document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);
});

export {
    wallet,
    shortenAddress,
    toggleWalletDropdown,
    updateWalletButton
};
