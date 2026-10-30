// ===== Particle — აფეთქების ნაწილაკი =====
import { color } from "../config.js";
import { random } from "../core/collision.js";

export class Particle {
    constructor(x, y, colorName) {
        this.x = x;
        this.y = y;
        this.vx = random(-100, 100);
        this.vy = random(-100, 100);
        this.size = Math.random() < 0.3 ? 2 : 1;
        this.color = color(colorName);
        this.life = 1; // 1 → 0
    }

    get dead() {
        return this.life <= 0;
    }

    update(dt) {
        // ხახუნი: ყოველ წამში სიჩქარე ~6-ჯერ მცირდება
        const friction = Math.pow(0.16, dt);
        this.vx *= friction;
        this.vy *= friction;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= 1.2 * dt;
    }

    draw(ctx) {
        // ნაწილაკი ბოლოს თეთრიდან ფერადზე გადადის და ქრება
        ctx.globalAlpha = this.life > 0.3 ? 1 : this.life / 0.3;
        ctx.fillStyle = this.life > 0.85 ? "#ffffff" : this.color;
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
        ctx.globalAlpha = 1;
    }
}
