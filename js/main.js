// 移动端菜单
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });

    // 点击菜单项时关闭菜单
    const menuItems = mobileMenu.querySelectorAll('a');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
});

// 滚动时改变导航栏样式
window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.classList.add('bg-opacity-95', 'shadow-lg');
    } else {
        nav.classList.remove('bg-opacity-95', 'shadow-lg');
    }
});

// 语言切换
const languageSelect = document.querySelector('select');
languageSelect.addEventListener('change', function(e) {
    const lang = e.target.value;
    // 这里添加语言切换逻辑
    console.log('Language changed to:', lang);
});

// 添加平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
