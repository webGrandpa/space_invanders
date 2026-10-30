// ===== Bullet — ტყვია (მოთამაშისაც და ბოსისაც) =====
import { GAME_WIDTH, GAME_HEIGHT, color } from "../config.js";

export class Bullet {
    constructor({ x, y, vx = 0, vy, radius = 2, color: colorName = "white", damage = 1 }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color(colorName);
        this.damage = damage;
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        const margin = this.radius + 4;
        if (
            this.x < -margin ||
            this.x > GAME_WIDTH + margin ||
            this.y < -margin ||
            this.y > GAME_HEIGHT + margin
        ) {
            this.dead = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
