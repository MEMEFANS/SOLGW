import { initReferral } from './referral.js';
import { handleSolInput, contribute } from './investment.js';

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化投资相关功能
    const solInput = document.getElementById('solAmount');
    const investButton = document.getElementById('investButton');
    
    if (solInput) {
        // 添加输入事件监听
        solInput.addEventListener('input', handleSolInput);
        // 手动调用一次处理函数进行初始化
        handleSolInput({ target: solInput });
    }

    if (investButton) {
        investButton.addEventListener('click', contribute);
    }

    // 初始化推荐功能
    initReferral();

    // 移动端菜单
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // 点击菜单项时关闭菜单
        const menuItems = mobileMenu.querySelectorAll('a');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
});

// 滚动时改变导航栏样式
window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (nav) {
        if (window.scrollY > 0) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
});
