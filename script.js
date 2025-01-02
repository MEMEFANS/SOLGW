// 获取用户首选语言
let currentLang = localStorage.getItem('language') || 
    (navigator.language.startsWith('zh') ? 'zh' : 'en');

// 更新页面文本
function updateContent() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = translations[currentLang];
        keys.forEach(k => {
            value = value[k];
        });
        if (value) {
            if (element.tagName === 'INPUT' && element.type === 'button') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    });
}

// 切换语言
function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    updateContent();
}

document.addEventListener('DOMContentLoaded', () => {
    // 路线图动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.timeline-item').forEach((item) => {
        observer.observe(item);
    });

    // 移动端菜单
    const menuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // 平滑滚动
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

    // 初始化语言
    updateContent();
});
