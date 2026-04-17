// ========================================
// ბოსების სისტემა — 4 უნიკალური ბოსი
// ========================================

const BOSS_NAMES = ["Makhare", "BeKa", "Lasha", "Nukri"];

// ========================================
// BossBase — საბაზისო კლასი
// ========================================
class BossBase {
    constructor(config) {
        this.bossNumber = config.bossNumber;
        this.name = config.name;
        this.width = config.width;
        this.height = config.height;
        this.x = canvas.width / 2;
        this.y = -this.height;
        // სირთულის მულტიპლიკატორები
        const diff = getDifficulty();
        this.maxHealth = Math.round(config.hp * diff.bossHpMul);
        this.health = this.maxHealth;
        this.baseSpeed = config.speed || 3;
        this.vx = (Math.random() > 0.5 ? 1 : -1) * this.baseSpeed;
        this.vy = 0.6;
        this.color = config.color || "#888";
        this.projSpeedMul = diff.bossProjSpeedMul;

        this.dialogue = null;
        this.dialogueTimeout = null;
        this.talkTimer = 0;
        this.talkInterval = config.talkInterval || 600;
        this.talkLines = config.talkLines || [];
        this.isDying = false;
        this.finalWordsText = config.finalWords || "...";

        this.shootTimer = 0;
        this.shootCooldown = Math.round((config.shootCooldown || 90) * diff.bossShootCooldownMul);
        this.attackPattern = 0;
        this.totalPatterns = config.totalPatterns || 3;
        this.burstCount = 0;
        this.burstTimer = 0;
        this.burstDelay = 8;
        this.enteredScreen = false;
    }

    update() {
        if (!this.isDying) {
            this.x += this.vx;
            this.y += this.vy;

            if (this.y > this.height / 2 + 30) this.enteredScreen = true;

            // X ასხლეტა
            if (this.x - this.width / 2 < 0 || this.x + this.width / 2 > canvas.width)
                this.vx = -this.vx;

            // Y საზღვრები
            if (this.enteredScreen) {
                if (this.y - this.height / 2 < 30 && this.vy < 0) this.vy = -this.vy;
                if (this.y + this.height / 2 > canvas.height * 0.45 && this.vy > 0) this.vy = -this.vy;
            }

            // სროლა
            this.shootTimer++;
            if (this.shootTimer >= this.shootCooldown && this.enteredScreen) {
                this.attack();
                this.shootTimer = 0;
            }

            // Burst
            if (this.burstCount > 0) {
                this.burstTimer++;
                if (this.burstTimer >= this.burstDelay) {
                    this.burstAttack();
                    this.burstCount--;
                    this.burstTimer = 0;
                }
            }

            // საუბარი
            this.talkTimer++;
            if (this.talkTimer > this.talkInterval && this.talkLines.length > 0) {
                if (Math.random() < 0.15) {
                    this.talk(this.talkLines[Math.floor(Math.random() * this.talkLines.length)]);
                    this.talkTimer = 0;
                }
            }
        }
        this.draw();
    }

    draw() {
        this.drawBody();
        this.drawHealthBar();
        this.drawNameTag();
        this.drawDialogue();
    }

    drawBody() { /* override */ }

    drawHealthBar() {
        const barWidth = Math.max(this.width * 0.8, 200);
        const barHeight = 12;
        const barY = this.y - this.height / 2 - 25;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x - barWidth / 2 - 2, barY - 2, barWidth + 4, barHeight + 4);
        ctx.fillStyle = "#660000";
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        const healthRatio = Math.max(0, this.health / this.maxHealth);
        const healthColor = healthRatio > 0.5 ? "#00ff00" : healthRatio > 0.25 ? "#ffaa00" : "#ff0000";
        ctx.fillStyle = healthColor;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthRatio, barHeight);
        ctx.restore();
    }

    drawNameTag() {
        ctx.save();
        ctx.font = "8px 'Press Start 2P', cursive";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x, this.y - this.height / 2 - 32);
        ctx.restore();
    }

    takeDamage(damage) {
        if (!this.isDying) this.health -= damage;
    }

    talk(text) {
        this.dialogue = text;
        if (this.dialogueTimeout) clearTimeout(this.dialogueTimeout);
        this.dialogueTimeout = setTimeout(() => {
            this.dialogue = null;
            this.dialogueTimeout = null;
        }, 4000);
    }

    drawDialogue() {
        if (!this.dialogue) return;
        ctx.save();

        // — Comic bubble settings —
        const font = "bold 18px 'Press Start 2P', cursive";
        ctx.font = font;
        const text = this.dialogue;
        const textWidth = ctx.measureText(text).width;
        const padX = 18;
        const padY = 14;
        const bubbleW = textWidth + padX * 2;
        const bubbleH = 36;
        const cornerR = 12;
        const tailH = 14;

        // Position: below the boss
        const bubbleX = this.x - bubbleW / 2;
        const bubbleY = this.y + this.height / 2 + tailH + 8;

        // Subtle float animation
        const floatY = this.isDying ? 0 : Math.sin(Date.now() / 300) * 4;
        const drawY = bubbleY + floatY;

        // — Shadow —
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // — Bubble background —
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(bubbleX + cornerR, drawY);
        ctx.lineTo(bubbleX + bubbleW - cornerR, drawY);
        ctx.quadraticCurveTo(bubbleX + bubbleW, drawY, bubbleX + bubbleW, drawY + cornerR);
        ctx.lineTo(bubbleX + bubbleW, drawY + bubbleH - cornerR);
        ctx.quadraticCurveTo(bubbleX + bubbleW, drawY + bubbleH, bubbleX + bubbleW - cornerR, drawY + bubbleH);
        ctx.lineTo(bubbleX + cornerR, drawY + bubbleH);
        ctx.quadraticCurveTo(bubbleX, drawY + bubbleH, bubbleX, drawY + bubbleH - cornerR);
        ctx.lineTo(bubbleX, drawY + cornerR);
        ctx.quadraticCurveTo(bubbleX, drawY, bubbleX + cornerR, drawY);
        ctx.closePath();
        ctx.fill();

        // — Reset shadow before stroke/tail —
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // — Bubble border —
        ctx.strokeStyle = "#222222";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // — Tail (triangle pointing up toward boss) —
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(this.x - 10, drawY);
        ctx.lineTo(this.x, drawY - tailH);
        ctx.lineTo(this.x + 10, drawY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#222222";
        ctx.lineWidth = 2.5;
        // Stroke only left and right edges of the tail (not the base that overlaps the bubble)
        ctx.beginPath();
        ctx.moveTo(this.x - 10, drawY);
        ctx.lineTo(this.x, drawY - tailH);
        ctx.lineTo(this.x + 10, drawY);
        ctx.stroke();

        // Cover the tail's base line with a white line so it blends into the bubble
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 9, drawY + 1);
        ctx.lineTo(this.x + 9, drawY + 1);
        ctx.stroke();

        // — Text —
        ctx.font = font;
        ctx.fillStyle = "#111111";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, this.x, drawY + bubbleH / 2 + 1);

        ctx.restore();
    }

    attack() {
        this.attackPattern = (this.attackPattern + 1) % this.totalPatterns;
    }

    burstAttack() { /* override */ }

    // === საერთო ატაკის ჰელპერები ===
    fireAimed(speed, radius, color, damage) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const s = speed * this.projSpeedMul;
        bossProjectiles.push(new BossProjectile(
            this.x, this.y + this.height / 2 - 20,
            (dx / dist) * s, (dy / dist) * s,
            radius, color, damage
        ));
    }

    fireSpread(count, speed, radius, color, damage) {
        const totalAngle = 0.8;
        const angleStep = totalAngle / (count - 1);
        const startAngle = -totalAngle / 2;
        const s = speed * this.projSpeedMul;
        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            bossProjectiles.push(new BossProjectile(
                this.x + Math.sin(angle) * 30,
                this.y + this.height / 2 - 20,
                Math.sin(angle) * s,
                Math.cos(angle) * s,
                radius, color, damage
            ));
        }
    }

    fireCircle(count, speed, radius, color, damage) {
        const s = speed * this.projSpeedMul;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            bossProjectiles.push(new BossProjectile(
                this.x, this.y,
                Math.cos(angle) * s,
                Math.sin(angle) * s,
                radius, color, damage
            ));
        }
    }

    fireStraightDown(offsetX, speed, radius, color, damage) {
        const s = speed * this.projSpeedMul;
        bossProjectiles.push(new BossProjectile(
            this.x + offsetX,
            this.y + this.height / 2 - 20,
            (Math.random() - 0.5) * 1.5, s,
            radius, color, damage
        ));
    }
}

// ========================================
// Boss1 — პროფესორი
// HP: 400 | 3 ატაკის პატერნი
// ========================================
class Boss1 extends BossBase {
    constructor() {
        super({
            bossNumber: 1,
            name: "Makhare",
            width: 280,
            height: 280,
            hp: 400,
            speed: 2.5,
            shootCooldown: 100,
            totalPatterns: 3,
            talkLines: ["კოდის წერა ისწავლე", "F ნიშანი გაქვს!", "ეს კოდი არ კომპილირდება"],
            finalWords: "გამოცდაში მაინც ჩაგჭრი!!!...",
        });
    }

    drawBody() {
        if (imgFirstBoss.complete && imgFirstBoss.naturalHeight !== 0) {
            ctx.drawImage(imgFirstBoss, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = "#555";
            ctx.beginPath();
            ctx.moveTo(-this.width * 0.45, -this.height * 0.3);
            ctx.quadraticCurveTo(0, -this.height * 0.5, this.width * 0.45, -this.height * 0.3);
            ctx.lineTo(this.width * 0.2, this.height * 0.3);
            ctx.quadraticCurveTo(0, this.height * 0.5, -this.width * 0.2, this.height * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#aa44ff";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }

    attack() {
        switch (this.attackPattern) {
            case 0: this.fireSpread(3, 4, 8, "#ff0055", 10); break;
            case 1: this.fireAimed(5, 10, "#aa00ff", 12); break;
            case 2: this.burstCount = 4; this.burstTimer = 0; break;
        }
        super.attack();
    }

    burstAttack() {
        this.fireStraightDown((Math.random() - 0.5) * 60, 4.5, 6, "#ff4400", 8);
    }
}

// ========================================
// Boss2 — ჰაკერი
// HP: 700 | 4 ატაკის პატერნი | Firewall + EMP
// ========================================
class Boss2 extends BossBase {
    constructor() {
        super({
            bossNumber: 2,
            name: "ჰაკერი",
            width: 210,
            height: 288,
            hp: 700,
            speed: 3.5,
            shootCooldown: 80,
            totalPatterns: 4,
            talkLines: [
                "ჩამჭრელი კითხვები გინდა?",
                "ფუნდამენტებიც არ იცი!",
                "დივებით წერე!",
                "AI ჩაგანაცვლებს!",
            ],
            finalWords: "მოდულის ბოლოს მე გავიცინებ!",
        });
    }

    drawBody() {
        if (imgSecondBoss.complete && imgSecondBoss.naturalHeight !== 0) {
            ctx.drawImage(imgSecondBoss, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            // Fallback ჰექსაგონი
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const r = this.width / 2;
                if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
                else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
            ctx.closePath();
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
            grad.addColorStop(0, "#0a3a0a");
            grad.addColorStop(1, "#001a00");
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = "#00ff44";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00ff44";
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fillStyle = "#00ff44";
            ctx.shadowBlur = 25;
            ctx.fill();
            ctx.restore();
        }
    }

    attack() {
        switch (this.attackPattern) {
            case 0: // სწრაფი მიზანმიმართული
                this.fireAimed(5.5, 7, "#00ff44", 12);
                setTimeout(() => { if (!this.isDying) this.fireAimed(5.5, 7, "#00ff44", 12); }, 200);
                break;
            case 1: // Firewall — ჰორიზონტალური ტყვია-კედელი
                this.firewall();
                break;
            case 2: // EMP — წრიული აფეთქება
                this.fireCircle(8, 3.5, 7, "#00ff44", 10);
                break;
            case 3: // კოდ ბურსტი
                this.burstCount = 5;
                this.burstTimer = 0;
                break;
        }
        super.attack();
    }

    firewall() {
        const count = 7;
        const spread = this.width * 1.2;
        for (let i = 0; i < count; i++) {
            const x = this.x - spread / 2 + (spread / (count - 1)) * i;
            bossProjectiles.push(new BossProjectile(x, this.y + this.height / 2, 0, 4, 6, "#00ff44", 10));
        }
    }

    burstAttack() {
        this.fireAimed(6, 5, "#44ff88", 8);
    }
}

// ========================================
// Boss3 — ვირუსი
// HP: 1100 | 4 ატაკის პატერნი | ტელეპორტი + მინიონები
// ========================================
class Boss3 extends BossBase {
    constructor() {
        super({
            bossNumber: 3,
            name: "Lasha",
            width: 275,
            height: 288,
            hp: 1100,
            speed: 3,
            shootCooldown: 65,
            totalPatterns: 4,
            talkInterval: 500,
            talkLines: [
                "არ უნდა ამას ამდენი შაში-ბეში",
                "ეე ძმაო ეგრე არაა...",
                "კარელოოოო!",
                "დავალებებს რატო არ წერ?",
            ],
            finalWords: "მაცადე გამოცდა მოვიდეს!...",
        });
        this.teleportTimer = 0;
        this.spiralAngle = 0;
    }

    update() {
        if (!this.isDying) {
            // ტელეპორტი
            this.teleportTimer++;
            if (this.teleportTimer > 400 && Math.random() < 0.02) {
                this.x = Math.random() * (canvas.width - this.width) + this.width / 2;
                this.y = Math.random() * (canvas.height * 0.3 - this.height) + this.height / 2 + 50;
                this.teleportTimer = 0;
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(this.x, this.y, "#ff0088"));
                }
            }
        }
        super.update();
    }

    drawBody() {
        if (imgThirdBoss.complete && imgThirdBoss.naturalHeight !== 0) {
            ctx.drawImage(imgThirdBoss, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            // Fallback ორგანული ბლობი
            ctx.save();
            ctx.translate(this.x, this.y);
            const time = Date.now() * 0.002;
            ctx.beginPath();
            const points = 16;
            for (let i = 0; i < points; i++) {
                const angle = (Math.PI * 2 / points) * i;
                const r = this.width / 2.2 + Math.sin(time * 2 + i * 1.2) * 12;
                if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
                else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
            ctx.closePath();
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
            grad.addColorStop(0, "#ff0044");
            grad.addColorStop(0.5, "#990033");
            grad.addColorStop(1, "#440022");
            ctx.fillStyle = grad;
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#ff0044";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fillStyle = "#ff4488";
            ctx.fill();
            ctx.restore();
        }
    }

    attack() {
        switch (this.attackPattern) {
            case 0: // სპირალი
                this.spiralAngle += 0.5;
                for (let i = 0; i < 4; i++) {
                    const angle = this.spiralAngle + (Math.PI * 2 / 4) * i;
                    bossProjectiles.push(new BossProjectile(
                        this.x, this.y,
                        Math.cos(angle) * 3.5, Math.sin(angle) * 3.5,
                        6, "#ff0088", 12,
                    ));
                }
                break;
            case 1: // ფართო სპრედი
                this.fireSpread(5, 3.5, 6, "#cc0044", 10);
                break;
            case 2: // მინიონების გამოძახება
                for (let i = 0; i < 2; i++) {
                    enemies.push(new Enemy(
                        this.x + (i === 0 ? -40 : 40),
                        this.y + this.height / 2, 1,
                    ));
                }
                break;
            case 3: // წვიმა
                this.burstCount = 6;
                this.burstTimer = 0;
                this.burstDelay = 6;
                break;
        }
        super.attack();
    }

    burstAttack() {
        this.fireStraightDown((Math.random() - 0.5) * 100, 5, 5, "#ff4488", 10);
    }
}

// ========================================
// Boss4 — AI ოვერლორდი (Final Boss)
// HP: 1500 | 5 ატაკის პატერნი | Enrage < 50% HP
// ========================================
class Boss4 extends BossBase {
    constructor() {
        super({
            bossNumber: 4,
            name: "Nukri",
            width: 210,
            height: 288,
            hp: 1500,
            speed: 2.5,
            shootCooldown: 70,
            totalPatterns: 5,
            talkInterval: 500,
            talkLines: [
                "საღამოს გავქოლოთ!",
                "Red flag!",
                "აჯენდაააააააა!",
                "სპიდრანიიი!",
            ],
            finalWords: "ეგ ჩემთვის რედფლეგია!...",
        });
        this.enraged = false;
        this.pulseTimer = 0;
    }

    update() {
        // Enrage HP < 50%
        if (!this.enraged && !this.isDying && this.health <= this.maxHealth * 0.5) {
            this.enraged = true;
            this.shootCooldown = 40;
            this.baseSpeed = 4;
            this.vx = (this.vx > 0 ? 1 : -1) * this.baseSpeed;
            this.talk("⚠ ENRAGED ⚠");
        }
        this.pulseTimer++;
        super.update();
    }

    drawBody() {
        // Enrage აურა (სურათის გარეთ)
        if (this.enraged) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 1.4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 100, 0, 0.08)";
            ctx.fill();
            ctx.restore();
        }

        if (imgFourthBoss.complete && imgFourthBoss.naturalHeight !== 0) {
            ctx.drawImage(imgFourthBoss, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            // Fallback ალმასი
            ctx.save();
            ctx.translate(this.x, this.y);
            const time = Date.now() * 0.001;
            const pulse = this.enraged ? 1 + Math.sin(time * 5) * 0.05 : 1;
            const w = (this.width / 2) * pulse;
            const h = (this.height / 2) * pulse;
            ctx.beginPath();
            ctx.moveTo(0, -h);
            ctx.lineTo(w, 0);
            ctx.lineTo(0, h);
            ctx.lineTo(-w, 0);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, -h, 0, h);
            if (this.enraged) {
                grad.addColorStop(0, "#ff4400");
                grad.addColorStop(0.5, "#ffcc00");
                grad.addColorStop(1, "#ff2200");
            } else {
                grad.addColorStop(0, "#ffcc00");
                grad.addColorStop(0.5, "#fff8e0");
                grad.addColorStop(1, "#ffaa00");
            }
            ctx.fillStyle = grad;
            ctx.shadowBlur = this.enraged ? 40 : 25;
            ctx.shadowColor = this.enraged ? "#ff4400" : "#ffcc00";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.fillStyle = this.enraged ? "#ff0000" : "#ff3300";
            ctx.fill();
            ctx.restore();
        }
    }

    attack() {
        const speedMul = this.enraged ? 1.3 : 1;

        switch (this.attackPattern) {
            case 0: // მულტი-სპრედი
                this.fireSpread(this.enraged ? 7 : 5, 4 * speedMul, 7, "#ffcc00", 15);
                break;
            case 1: // სამმაგი მიზანმიმართული
                this.fireAimed(5 * speedMul, 9, "#ff6600", 15);
                setTimeout(() => { if (!this.isDying) this.fireAimed(5 * speedMul, 9, "#ff6600", 15); }, 150);
                setTimeout(() => { if (!this.isDying) this.fireAimed(5 * speedMul, 9, "#ff6600", 15); }, 300);
                break;
            case 2: // რინგი
                this.fireCircle(this.enraged ? 16 : 12, 3 * speedMul, 6, "#ffaa00", 12);
                break;
            case 3: // ჯვრის პატერნი — 8 მიმართულება
                const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5,
                    Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4];
                angles.forEach(a => {
                    bossProjectiles.push(new BossProjectile(
                        this.x, this.y,
                        Math.cos(a) * 4 * speedMul, Math.sin(a) * 4 * speedMul,
                        6, "#ffffff", 12,
                    ));
                });
                break;
            case 4: // ქაოს ბურსტი
                this.burstCount = this.enraged ? 8 : 5;
                this.burstTimer = 0;
                this.burstDelay = this.enraged ? 5 : 7;
                break;
        }
        super.attack();
    }

    burstAttack() {
        if (Math.random() < 0.5) {
            this.fireAimed(5.5, 6, "#ffdd00", 12);
        } else {
            this.fireStraightDown((Math.random() - 0.5) * 120, 5, 7, "#ff8800", 12);
        }
    }
}

// ========================================
// ბოსის შემქმნელი ფუნქცია
// ========================================
function createBoss(bossIndex) {
    switch (bossIndex) {
        case 0: return new Boss1();
        case 1: return new Boss2();
        case 2: return new Boss3();
        case 3: return new Boss4();
        default: return null;
    }
}
