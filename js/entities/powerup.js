// ===== PowerUp — ბონუსი, რომელიც მეტეორიდან ცვივა =====
import { GAME_WIDTH, GAME_HEIGHT, POWERUPS, color } from "../config.js";
import { random } from "../core/collision.js";
import { drawIcon, drawPixelFrame } from "../ui/draw.js";

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
        // ბოლო 2 წამში ციმციმებს — მალე გაქრება
        if (this.lifetime - this.age < 2 && Math.floor(this.age * 8) % 2) return;

        const bob = Math.round(Math.sin(this.age * 4));
        const left = Math.round(this.x) - 6;
        const top = Math.round(this.y) - 6 + bob;
        // მაჯისცემასავით "ციმციმა" ჩარჩო
        const border = Math.floor(this.age * 4) % 2 ? this.color : "white";
        drawPixelFrame(ctx, left, top, 13, 13, { fill: "black", border });
        drawIcon(ctx, this.config.icon, left + 3, top + 3, this.color);
    }
}
