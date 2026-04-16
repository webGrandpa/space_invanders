// ===== Star (ფონის ვარსკვლავები) =====
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.5 + 0.3;
        this.speed = Math.random() * 0.5 + 0.1;
        this.alpha = Math.random() * 0.8 + 0.2;
        this.flickerSpeed = Math.random() * 0.02 + 0.005;
    }
    update() {
        this.y += this.speed;
        this.alpha += Math.sin(Date.now() * this.flickerSpeed) * 0.01;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, this.alpha));
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ===== Player (მოთამაშის ხომალდი) =====
class Player {
    constructor() {
        this.width = 60;
        this.height = 60;
        this.x = canvas.width / 2;
        this.y = canvas.height - 80;
        this.img = imgPlayer;
    }
    update() {
        if (this.x < this.width / 2) this.x = this.width / 2;
        if (this.x > canvas.width - this.width / 2)
            this.x = canvas.width - this.width / 2;
        this.draw();
    }
    draw() {
        if (this.img.complete && this.img.naturalHeight !== 0) {
            ctx.drawImage(
                this.img,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height,
            );
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = "#00ffaa";
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ff6600";
            ctx.beginPath();
            ctx.moveTo(-10, this.height / 2);
            ctx.lineTo(0, this.height / 2 + 15);
            ctx.lineTo(10, this.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}

// ===== Projectile (მოთამაშის ტყვია) =====
class Projectile {
    constructor(x, y, vx, speed, radius, color, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = -speed;
        this.radius = radius;
        this.color = color;
        this.damage = damage;
        this.markedForDeletion = false;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

// ===== BossProjectile (ბოსის ტყვია) =====
class BossProjectile {
    constructor(x, y, vx, vy, radius, color, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.damage = damage;
        this.markedForDeletion = false;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.restore();
    }
}

// ===== Enemy (მეტეორი) =====
class Enemy {
    constructor(x, y, tier) {
        this.tier = tier || Math.floor(Math.random() * 3) + 1;
        this.radius = this.tier * 15;
        this.x = x !== undefined ? x : Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = y !== undefined ? y : -this.radius;
        const speedMul = getDifficulty().enemySpeedMul;
        this.vx = (Math.random() - 0.5) * 2 * speedMul;
        this.vy = (Math.random() * 1.5 + 0.5) * speedMul;
        this.img = imgMeteor;
        this.markedForDeletion = false;
        this.maxHp = this.tier * 2;
        this.hp = this.maxHp;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx = -this.vx;
        }
        this.draw();
    }
    draw() {
        if (this.img.complete && this.img.naturalHeight !== 0) {
            ctx.drawImage(
                this.img,
                this.x - this.radius,
                this.y - this.radius,
                this.radius * 2,
                this.radius * 2,
            );
        } else {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.tier >= 3 ? "#ff4444" : this.tier >= 2 ? "#ff8800" : "#aaaaaa";
            ctx.fill();
            ctx.restore();
        }
        if (this.hp < this.maxHp) {
            const barWidth = this.radius * 1.5;
            const barHeight = 4;
            ctx.save();
            ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
            ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
            ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * (this.hp / this.maxHp), barHeight);
            ctx.restore();
        }
    }
}

// ===== Particle (აფეთქების ნაწილაკი) =====
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.alpha = 1;
        this.friction = 0.97;
    }
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

// ===== PowerUp (ბონუსი მეტეორიდან) =====
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = POWERUP_TYPES[type];
        this.radius = 14;
        this.vy = 1.2;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.markedForDeletion = false;
        this.spawnTime = Date.now();
        this.lifetime = 12000;
        this.angle = 0;
    }
    update() {
        this.y += this.vy;
        this.x += this.vx;
        this.angle += 0.03;
        if (this.y > canvas.height + this.radius ||
            Date.now() - this.spawnTime > this.lifetime) {
            this.markedForDeletion = true;
        }
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx = -this.vx;
        }
        this.draw();
    }
    draw() {
        const pulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
        const bob = Math.sin(Date.now() * 0.003) * 4;

        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = this.config.glowColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.4, this.config.color);
        grad.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.font = "bold 14px 'Press Start 2P', cursive";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.config.symbol, 0, 1);
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.rotate(this.angle);
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.008) * 0.5;
        ctx.beginPath();
        const s = this.radius * 1.3;
        ctx.moveTo(-s, -s);
        ctx.lineTo(s, -s);
        ctx.lineTo(s, s);
        ctx.lineTo(-s, s);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}
