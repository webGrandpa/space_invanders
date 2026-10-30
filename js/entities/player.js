// ===== Player — მოთამაშის ხომალდი =====
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, WEAPONS, color } from "../config.js";
import { getSprite, drawSprite } from "../core/assets.js";
import { clamp } from "../core/collision.js";
import { Bullet } from "./bullet.js";

export const SHIP_IMAGE = "assets/sprites/ship.png";

export class Player {
    constructor() {
        this.width = PLAYER.width;
        this.height = PLAYER.height;
        this.radius = PLAYER.radius;
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT - 34;
        this.weaponLevel = 1;
        this.lastShotTime = -Infinity;
        this.flash = 0; // რამდენ ხანს "ციმციმებს" დაზიანების შემდეგ
    }

    get weapon() {
        return WEAPONS[this.weaponLevel - 1];
    }

    update(dt, input) {
        this.flash = Math.max(0, this.flash - dt);
        const direction = input.moveDirection;
        if (direction !== 0) {
            this.x += direction * PLAYER.speed * dt;
        } else if (input.usingPointer && input.pointerX !== null) {
            this.x = input.pointerX;
        }
        this.x = clamp(this.x, this.width / 2, GAME_WIDTH - this.width / 2);
    }

    // აბრუნებს ახალ ტყვიებს, ან ცარიელ მასივს, თუ იარაღი ჯერ არ "გაგრილებულა"
    shoot(time, cooldownMul = 1) {
        const weapon = this.weapon;
        if (time - this.lastShotTime < weapon.cooldown * cooldownMul) return [];
        this.lastShotTime = time;

        return weapon.pattern.map(
            ({ dx = 0, dy = 0, vx = 0, speedMul = 1 }) =>
                new Bullet({
                    x: this.x + dx,
                    y: this.y + dy,
                    vx,
                    vy: -weapon.speed * speedMul,
                    radius: weapon.radius,
                    color: weapon.color,
                    damage: weapon.damage,
                }),
        );
    }

    draw(ctx, time) {
        // ძრავის ალი
        const flameLength = 3 + Math.round(Math.sin(time * 40) + 1);
        ctx.fillStyle = color("orange");
        ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y + this.height / 2) - 2, 2, flameLength);
        ctx.fillStyle = color("yellow");
        ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y + this.height / 2) - 2, 2, 2);

        const tint = this.flash > 0 && Math.floor(this.flash * 30) % 2 ? color("red") : null;
        const sprite = getSprite(SHIP_IMAGE, this.width, this.height, tint);
        if (sprite) {
            drawSprite(ctx, sprite, this.x, this.y);
            return;
        }
        ctx.fillStyle = color("green");
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
    }
}
