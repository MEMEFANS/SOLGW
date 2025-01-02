// 倒计时功能
function updateCountdown() {
    const endDate = new Date('2024-02-01T00:00:00');
    const now = new Date();
    const diff = endDate - now;

    if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days;
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
}

// 初始化倒计时
function initCountdown() {
    setInterval(updateCountdown, 1000);
    updateCountdown(); // 初始化显示
}

export { initCountdown };
