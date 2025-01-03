class SnakeBackground {
    constructor() {
        this.container = document.querySelector('.snake-background');
        if (!this.container) {
            console.error('找不到 snake-background 容器');
            return;
        }

        this.gridSize = 40;
        this.snakeSegments = [];
        this.foods = [];
        this.glowEffects = [];
        this.particles = [];
        this.maxFoods = 3;
        this.segmentCount = 5;
        this.speed = 2;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.positions = [];
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;

        this.init();
        this.setupMouseTracking();
        this.animate();
    }

    init() {
        // 创建蛇的身体段
        for (let i = 0; i < this.segmentCount; i++) {
            const segment = document.createElement('div');
            segment.className = 'snake-segment';
            this.container.appendChild(segment);
            
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;
            
            this.snakeSegments.push({
                element: segment,
                x: x,
                y: y
            });
            
            this.positions.push({x: x, y: y});
        }

        // 创建头部（作为独立元素）
        const head = document.createElement('div');
        head.className = 'snake-head';
        this.container.appendChild(head);
        this.snakeHead = head;

        // 创建食物
        for (let i = 0; i < this.maxFoods; i++) {
            this.createFood();
        }

        // 创建粒子
        this.createParticles();
        
        // 创建流光线条
        this.createFlowLines();
        
        // 创建能量波纹
        this.createRipples();
    }

    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    createFood() {
        const food = document.createElement('div');
        food.className = 'food';
        
        const bone = document.createElement('div');
        bone.className = 'bone';
        food.appendChild(bone);
        
        this.container.appendChild(food);
        
        const x = Math.random() * (window.innerWidth - 20);
        const y = Math.random() * (window.innerHeight - 20);
        
        food.style.left = x + 'px';
        food.style.top = y + 'px';
        
        this.foods.push({
            element: food,
            x: x,
            y: y
        });
    }

    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        this.container.appendChild(particlesContainer);

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particlesContainer.appendChild(particle);
        }
    }

    createFlowLines() {
        const flowLinesContainer = document.createElement('div');
        flowLinesContainer.className = 'flow-lines';
        this.container.appendChild(flowLinesContainer);

        for (let i = 0; i < 10; i++) {
            const line = document.createElement('div');
            line.className = 'flow-line';
            line.style.top = (Math.random() * 100) + '%';
            line.style.width = (Math.random() * 200 + 100) + 'px';
            line.style.animationDelay = (Math.random() * 2) + 's';
            flowLinesContainer.appendChild(line);
        }
    }

    createRipples() {
        const ripplesContainer = document.createElement('div');
        ripplesContainer.className = 'energy-ripples';
        this.container.appendChild(ripplesContainer);

        setInterval(() => {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.left = Math.random() * 100 + '%';
            ripple.style.top = Math.random() * 100 + '%';
            ripplesContainer.appendChild(ripple);

            // 动画结束后移除元素
            setTimeout(() => {
                ripple.remove();
            }, 4000);
        }, 2000);
    }

    updateSnake() {
        // 计算目标角度
        const dx = this.mouseX - this.snakeSegments[0].x;
        const dy = this.mouseY - this.snakeSegments[0].y;
        this.targetAngle = Math.atan2(dy, dx);

        // 平滑转向
        let angleDiff = this.targetAngle - this.angle;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle += angleDiff * 0.1;

        // 更新头部位置
        const head = this.snakeSegments[0];
        head.x += Math.cos(this.angle) * this.speed;
        head.y += Math.sin(this.angle) * this.speed;

        // 边界检查
        if (head.x < 0) head.x = window.innerWidth;
        if (head.x > window.innerWidth) head.x = 0;
        if (head.y < 0) head.y = window.innerHeight;
        if (head.y > window.innerHeight) head.y = 0;

        // 更新头部元素位置和旋转
        const bodyOffset = 12.5;  // 25/2 = 12.5
        const headOffset = 15;    // 30/2 = 15
        const headDistance = 15;  // 头部和身体的距离
        
        // 计算头部位置（在身体前方）
        const headX = head.x + Math.cos(this.angle) * headDistance;
        const headY = head.y + Math.sin(this.angle) * headDistance;
        
        head.element.style.left = (head.x - bodyOffset) + 'px';
        head.element.style.top = (head.y - bodyOffset) + 'px';
        this.snakeHead.style.left = (headX - headOffset) + 'px';
        this.snakeHead.style.top = (headY - headOffset) + 'px';
        this.snakeHead.style.transform = `rotate(${this.angle + Math.PI/2}rad)`;

        // 检查是否吃到食物
        for (let i = 0; i < this.foods.length; i++) {
            const food = this.foods[i];
            const dx = headX - food.x;
            const dy = headY - food.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {  // 碰撞检测范围
                // 移除食物
                food.element.remove();
                this.foods.splice(i, 1);
                
                // 创建新食物
                this.createFood();
                
                // 增加蛇的长度
                this.addSegment();
                break;
            }
        }

        // 更新位置历史
        this.positions.unshift({x: head.x, y: head.y});
        if (this.positions.length > this.snakeSegments.length * 5) {
            this.positions.pop();
        }

        // 更新身体段位置
        for (let i = 1; i < this.snakeSegments.length; i++) {
            const segment = this.snakeSegments[i];
            const targetPos = this.positions[i * 2];
            
            if (targetPos) {
                const dx = targetPos.x - segment.x;
                const dy = targetPos.y - segment.y;
                segment.x += dx * 0.5;
                segment.y += dy * 0.5;
                
                segment.element.style.left = (segment.x - bodyOffset) + 'px';
                segment.element.style.top = (segment.y - bodyOffset) + 'px';
            }
        }
    }

    addSegment() {
        // 创建新的身体段
        const segment = document.createElement('div');
        segment.className = 'snake-segment';
        this.container.appendChild(segment);
        
        // 获取最后一个段的位置
        const lastSegment = this.snakeSegments[this.snakeSegments.length - 1];
        const x = lastSegment.x;
        const y = lastSegment.y;
        
        // 添加新段
        this.snakeSegments.push({
            element: segment,
            x: x,
            y: y
        });
    }

    animate() {
        this.updateSnake();
        requestAnimationFrame(() => this.animate());
    }
}

// 当页面加载完成后初始化背景
document.addEventListener('DOMContentLoaded', () => {
    new SnakeBackground();
});
