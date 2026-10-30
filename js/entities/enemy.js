// ===== Enemy — მეტეორი =====
// tier 1-3: რაც დიდია, მით მეტი სიცოცხლე აქვს. დიდი მეტეორი ნამსხვრევებად იშლება.
import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";
import { getImage } from "../core/assets.js";
import { random } from "../core/collision.js";

export const METEOR_IMAGE = "assets/sprites/meteor.avif";

export class Enemy {
    constructor({ x, y, tier, speedMul = 1 }) {
        this.tier = tier ?? Math.floor(random(1, 4));
        this.radius = this.tier * 6;
        this.x = x ?? random(this.radius, GAME_WIDTH - this.radius);
        this.y = y ?? -this.radius;
        this.vx = random(-24, 24) * speedMul;
        this.vy = random(12, 48) * speedMul;
        this.maxHp = this.tier * 2;
        this.hp = this.maxHp;
        this.dead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x - this.radius < 0) this.vx = Math.abs(this.vx);
        if (this.x + this.radius > GAME_WIDTH) this.vx = -Math.abs(this.vx);
        if (this.y > GAME_HEIGHT + this.radius) this.dead = true;
    }

    // აბრუნებს ნამსხვრევებს, რომლებიც განადგურებისას ჩნდება
    split(speedMul) {
        if (this.tier === 1) return [];
        const tier = this.tier - 1;
        const offset = tier * 3;
        return [
            new Enemy({ x: this.x - offset, y: this.y, tier, speedMul }),
            new Enemy({ x: this.x + offset, y: this.y, tier, speedMul }),
        ];
    }

    draw(ctx) {
        const img = getImage(METEOR_IMAGE);
        const size = this.radius * 2;
        if (img) {
            ctx.drawImage(img, this.x - this.radius, this.y - this.radius, size, size);
        } else {
            ctx.fillStyle = "#8a5a44";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // სიცოცხლის ზოლი მხოლოდ დაზიანების შემდეგ ჩანს
        if (this.hp < this.maxHp) {
            const width = this.radius * 1.5;
            const left = this.x - width / 2;
            const top = this.y - this.radius - 5;
            ctx.fillStyle = "#ff3b5c";
            ctx.fillRect(left, top, width, 2);
            ctx.fillStyle = "#9cff57";
            ctx.fillRect(left, top, width * (this.hp / this.maxHp), 2);
        }
    }
}
