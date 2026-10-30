// ===== Player — მოთამაშის ხომალდი =====
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, WEAPONS } from "../config.js";
import { getImage } from "../core/assets.js";
import { clamp } from "../core/collision.js";
import { Bullet } from "./bullet.js";

export const SHIP_IMAGE = "assets/sprites/ship.png";

export class Player {
    constructor() {
        this.size = PLAYER.size;
        this.radius = PLAYER.radius;
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT - 30;
        this.weaponLevel = 1;
        this.lastShotTime = -Infinity;
    }

    get weapon() {
        return WEAPONS[this.weaponLevel - 1];
    }

    update(dt, input) {
        const direction = input.moveDirection;
        if (direction !== 0) {
            this.x += direction * PLAYER.speed * dt;
        } else if (input.usingPointer && input.pointerX !== null) {
            this.x = input.pointerX;
        }
        this.x = clamp(this.x, this.size / 2, GAME_WIDTH - this.size / 2);
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

    draw(ctx) {
        const img = getImage(SHIP_IMAGE);
        const half = this.size / 2;
        if (img) {
            ctx.drawImage(img, this.x - half, this.y - half, this.size, this.size);
            return;
        }
        ctx.fillStyle = "#2ee6a6";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - half);
        ctx.lineTo(this.x - half, this.y + half);
        ctx.lineTo(this.x + half, this.y + half);
        ctx.closePath();
        ctx.fill();
    }
}
