// 页面加载优化
document.addEventListener('DOMContentLoaded', () => {
    // 移除加载指示器
    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 300);
    
    // 显示页面内容
    document.body.classList.add('loaded');

    // 懒加载图片
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // 初始化 AOS
    AOS.init({
        duration: 800,
        once: true,
        disable: window.innerWidth < 768
    });

    // 移动端菜单
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // 关闭移动端菜单
                mobileMenu.classList.remove('active');
            }
        });
    });

    // 进度条动画
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = entry.target.getAttribute('data-width');
            }
        });
    });

    document.querySelectorAll('.progress-bar').forEach(bar => {
        progressObserver.observe(bar);
    });

    // 预加载视频缩略图
    const videoThumbnail = new Image();
    videoThumbnail.src = 'images/video-thumbnail.jpg';
});

// 性能监控
const performanceMetrics = {
    init() {
        this.measurePageLoad();
        this.measureFirstContentfulPaint();
        this.measureLargestContentfulPaint();
    },

    measurePageLoad() {
        window.addEventListener('load', () => {
            const pageLoadTime = performance.now();
            console.log(`Page Load Time: ${pageLoadTime}ms`);
        });
    },

    measureFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
            console.log(`First Contentful Paint: ${fcp.startTime}ms`);
        }
    },

    measureLargestContentfulPaint() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log(`Largest Contentful Paint: ${lastEntry.startTime}ms`);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
    }
};

// 初始化性能监控
performanceMetrics.init();
