// ===== Enemy — მეტეორი =====
// tier 1-3: რაც დიდია, მით მეტი სიცოცხლე აქვს. დიდი მეტეორი ნამსხვრევებად იშლება.
import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";
import { getSprite, drawSprite } from "../core/assets.js";
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
        this.flash = 0; // მოხვედრისას წამიერად თეთრდება
        this.dead = false;
    }

    hit(damage) {
        this.hp -= damage;
        this.flash = 0.06;
    }

    update(dt) {
        this.flash = Math.max(0, this.flash - dt);
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
        const size = this.radius * 2;
        const sprite = getSprite(METEOR_IMAGE, size, size, this.flash > 0 ? "#ffffff" : null);
        if (sprite) {
            drawSprite(ctx, sprite, this.x, this.y);
        } else {
            ctx.fillStyle = "#8a5a44";
            ctx.fillRect(Math.round(this.x - this.radius), Math.round(this.y - this.radius), size, size);
        }

        // სიცოცხლის ზოლი მხოლოდ დაზიანების შემდეგ ჩანს
        if (this.hp < this.maxHp) {
            const width = Math.round(this.radius * 1.5);
            const left = Math.round(this.x - width / 2);
            const top = Math.round(this.y - this.radius - 5);
            ctx.fillStyle = "#26285e";
            ctx.fillRect(left, top, width, 2);
            ctx.fillStyle = "#9cff57";
            ctx.fillRect(left, top, Math.ceil(width * (this.hp / this.maxHp)), 2);
        }
    }
}
