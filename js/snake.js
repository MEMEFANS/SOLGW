class Snake {
    constructor(container) {
        this.container = container;
        this.segmentSize = 25;
        this.segments = [];
        this.direction = { x: 1, y: 0 };
        this.targetDirection = { x: 1, y: 0 };
        this.speed = 5;
        this.autoMoveTimer = null;
        this.lastUpdateTime = 0;
        this.mousePosition = null;
        this.isFollowingMouse = false;
        this.autoMoveAngle = 0;
        this.food = null;
        
        this.init();
        this.setupEventListeners();
        this.startAutoMove();
        this.generateFood();
    }

    init() {
        // 创建初始蛇身
        const startX = this.container.clientWidth / 2;
        const startY = this.container.clientHeight / 2;
        
        // 创建更多的初始段
        for (let i = 0; i < 8; i++) {
            this.addSegment(startX - i * 20, startY, i === 0);
        }
    }

    addSegment(x, y, isHead = false) {
        const segment = document.createElement('div');
        segment.className = isHead ? 'snake-head' : 'snake-segment';
        
        if (isHead) {
            const headImage = document.createElement('div');
            headImage.className = 'head-image';
            segment.appendChild(headImage);
        }
        
        this.container.appendChild(segment);
        this.segments.push({
            element: segment,
            x: x,
            y: y,
            targetX: x,
            targetY: y
        });
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mousePosition = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.isFollowingMouse = true;
            
            // 重置自动移动计时器
            if (this.autoMoveTimer) {
                clearTimeout(this.autoMoveTimer);
            }
            
            // 如果鼠标停止移动3秒后，恢复自动移动
            this.autoMoveTimer = setTimeout(() => {
                this.isFollowingMouse = false;
                this.startAutoMove();
            }, 3000);
        });
    }

    startAutoMove() {
        this.autoMoveAngle = Math.random() * Math.PI * 2; // 随机初始角度
        this.update();
    }

    generateFood() {
        if (this.food) {
            this.container.removeChild(this.food.element);
        }

        const bounds = this.container.getBoundingClientRect();
        const x = Math.random() * (bounds.width - 50);
        const y = Math.random() * (bounds.height - 50);

        const foodElement = document.createElement('div');
        foodElement.className = 'food';
        foodElement.style.left = `${x}px`;
        foodElement.style.top = `${y}px`;

        // 创建骨头图片容器
        const boneImage = document.createElement('div');
        boneImage.className = 'bone-image';
        foodElement.appendChild(boneImage);

        this.container.appendChild(foodElement);
        this.food = {
            element: foodElement,
            x: x,
            y: y
        };
    }

    checkFoodCollision() {
        if (!this.food) return;

        const head = this.segments[0];
        const dx = head.x - this.food.x;
        const dy = head.y - this.food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.segmentSize) {
            this.generateFood();
            this.addSegment(
                this.segments[this.segments.length - 1].x,
                this.segments[this.segments.length - 1].y
            );
        }
    }

    update() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;

        if (deltaTime >= 1000 / 60) {
            if (this.isFollowingMouse && this.mousePosition) {
                const head = this.segments[0];
                const dx = this.mousePosition.x - (head.x + 17.5); // 考虑头部中心点
                const dy = this.mousePosition.y - (head.y + 17.5);
                const angle = Math.atan2(dy, dx);
                
                // 平滑转向
                const targetDirection = {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                };
                
                // 插值计算新方向
                this.direction = {
                    x: this.direction.x + (targetDirection.x - this.direction.x) * 0.15,
                    y: this.direction.y + (targetDirection.y - this.direction.y) * 0.15
                };
                
                // 归一化方向向量
                const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
                if (length !== 0) {
                    this.direction.x /= length;
                    this.direction.y /= length;
                }
            } else {
                // 自动移动模式
                this.autoMoveAngle += (Math.random() - 0.5) * 0.03;
                const targetDirection = {
                    x: Math.cos(this.autoMoveAngle),
                    y: Math.sin(this.autoMoveAngle)
                };
                
                // 平滑转向
                this.direction = {
                    x: this.direction.x + (targetDirection.x - this.direction.x) * 0.05,
                    y: this.direction.y + (targetDirection.y - this.direction.y) * 0.05
                };

                // 检查是否接近边界
                const head = this.segments[0];
                const margin = 100;
                const bounds = this.container.getBoundingClientRect();
                const headCenterX = head.x + 17.5;
                const headCenterY = head.y + 17.5;

                if (headCenterX < margin || headCenterX > bounds.width - margin ||
                    headCenterY < margin || headCenterY > bounds.height - margin) {
                    const centerX = bounds.width / 2;
                    const centerY = bounds.height / 2;
                    this.autoMoveAngle = Math.atan2(centerY - headCenterY, centerX - headCenterX);
                }
            }

            // 更新蛇的位置
            const speed = this.isFollowingMouse ? this.speed * 1.2 : this.speed;
            const head = this.segments[0];
            
            // 更新头部目标位置
            head.targetX = head.x + this.direction.x * speed;
            head.targetY = head.y + this.direction.y * speed;

            // 确保在容器内
            const bounds = this.container.getBoundingClientRect();
            head.targetX = Math.max(0, Math.min(bounds.width - 35, head.targetX));
            head.targetY = Math.max(0, Math.min(bounds.height - 35, head.targetY));

            // 平滑更新位置
            for (let i = 0; i < this.segments.length; i++) {
                const segment = this.segments[i];
                
                if (i === 0) {
                    // 头部直接跟随目标位置
                    segment.x += (segment.targetX - segment.x) * 0.3;
                    segment.y += (segment.targetY - segment.y) * 0.3;
                } else {
                    // 身体跟随前一个段
                    const prev = this.segments[i - 1];
                    let followDistance;
                    
                    if (i === 1) {
                        // 第一个身体段和头部的距离
                        followDistance = 12;
                    } else {
                        // 其他段之间的距离
                        followDistance = 16 - i * 0.5;
                    }
                    
                    // 计算目标位置
                    const angle = Math.atan2(prev.y - segment.y, prev.x - segment.x);
                    
                    if (i === 1) {
                        // 第一个身体段相对头部的位置调整
                        segment.targetX = prev.x + Math.cos(angle) * 2 - Math.cos(angle) * followDistance;
                        segment.targetY = prev.y + Math.sin(angle) * 2 - Math.sin(angle) * followDistance;
                    } else {
                        segment.targetX = prev.x - Math.cos(angle) * followDistance;
                        segment.targetY = prev.y - Math.sin(angle) * followDistance;
                    }
                    
                    // 平滑移动到目标位置
                    const followSpeed = 0.2 - i * 0.01;
                    segment.x += (segment.targetX - segment.x) * followSpeed;
                    segment.y += (segment.targetY - segment.y) * followSpeed;
                }

                // 更新元素位置
                segment.element.style.left = `${segment.x}px`;
                segment.element.style.top = `${segment.y}px`;
            }

            this.checkFoodCollision();
            this.lastUpdateTime = currentTime;
        }

        requestAnimationFrame(() => this.update());
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.game-container');
    if (container) {
        new Snake(container);
    }
});
