// ===== PowerUp — ბონუსი, რომელიც მეტეორიდან ცვივა =====
import { GAME_WIDTH, GAME_HEIGHT, POWERUPS, color } from "../config.js";
import { random } from "../core/collision.js";

export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = POWERUPS[type];
        this.color = color(this.config.color);
        this.radius = 6;
        this.vx = random(-10, 10);
        this.vy = 30;
        this.age = 0;
        this.lifetime = 12;
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.age += dt;
        if (this.x - this.radius < 0 || this.x + this.radius > GAME_WIDTH) this.vx = -this.vx;
        if (this.y > GAME_HEIGHT + this.radius || this.age > this.lifetime) this.dead = true;
    }

    draw(ctx) {
        const bob = Math.round(Math.sin(this.age * 3) * 2);
        // ბოლო 2 წამში ციმციმებს — მალე გაქრება
        if (this.lifetime - this.age < 2 && Math.floor(this.age * 8) % 2) return;

        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(-9, -9, 18, 18);
        ctx.globalAlpha = 1;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = "#0b0b1a";
        ctx.font = "8px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.config.symbol, 0.5, 1);
        ctx.restore();
    }
}
