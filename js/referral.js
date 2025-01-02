// 从 URL 获取推荐人地址
export function getReferrer() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref && ref.length === 44) { // Solana 地址长度为 44 个字符
        return ref;
    }
    return null;
}

// 生成推荐链接
export function generateReferralLink(walletAddress) {
    if (!walletAddress) return '';
    // 使用当前页面的完整 URL（包括协议）
    const baseUrl = window.location.href.split('?')[0];
    return `${baseUrl}?ref=${walletAddress}`;
}

// 更新推荐链接显示
export function updateReferralLink(walletAddress) {
    const referralLinkInput = document.getElementById('referralLink');
    const referralStatus = document.getElementById('referralStatus');
    const copyButton = document.getElementById('copyReferral');
    
    if (referralLinkInput && referralStatus) {
        if (walletAddress) {
            const link = generateReferralLink(walletAddress);
            referralLinkInput.value = link;
            referralLinkInput.removeAttribute('disabled');
            if (copyButton) copyButton.removeAttribute('disabled');
            
            // 检查是否有推荐人
            const referrer = getReferrer();
            if (referrer && referrer !== walletAddress) {
                referralStatus.textContent = '已通过推荐链接访问';
                referralStatus.classList.add('text-green-500');
            } else {
                referralStatus.textContent = '分享您的链接获得 10% 推荐奖励';
                referralStatus.classList.remove('text-green-500');
            }
        } else {
            referralLinkInput.value = '请先连接钱包';
            referralLinkInput.setAttribute('disabled', 'disabled');
            if (copyButton) copyButton.setAttribute('disabled', 'disabled');
            referralStatus.textContent = '';
        }
    }
}

// 复制推荐链接
export async function copyReferralLink() {
    const referralLink = document.getElementById('referralLink');
    const referralStatus = document.getElementById('referralStatus');
    
    if (referralLink && referralLink.value !== '请先连接钱包') {
        try {
            await navigator.clipboard.writeText(referralLink.value);
            referralStatus.textContent = '复制成功！';
            referralStatus.classList.add('text-green-500');
            referralStatus.classList.remove('text-red-500');
            
            // 3秒后恢复原始状态消息
            setTimeout(() => {
                const referrer = getReferrer();
                if (referrer) {
                    referralStatus.textContent = '已通过推荐链接访问';
                } else {
                    referralStatus.textContent = '分享您的链接获得 10% 推荐奖励';
                }
                referralStatus.classList.remove('text-green-500');
            }, 3000);
        } catch (err) {
            console.error('复制失败:', err);
            referralStatus.textContent = '复制失败，请手动复制';
            referralStatus.classList.add('text-red-500');
        }
    }
}

// 获取推荐奖励金额
export function getReferralReward(amount) {
    return amount * 0.1; // 10% 推荐奖励
}

// 初始化推荐链接功能
export function initReferral() {
    // 绑定复制按钮事件
    const copyButton = document.getElementById('copyReferral');
    if (copyButton) {
        copyButton.addEventListener('click', copyReferralLink);
    }

    // 检查是否是通过推荐链接访问
    const referrer = getReferrer();
    if (referrer) {
        const referralStatus = document.getElementById('referralStatus');
        if (referralStatus) {
            referralStatus.textContent = '已通过推荐链接访问';
            referralStatus.classList.add('text-green-500');
        }
    }
}
