// ===== Bullet — ტყვია (მოთამაშისაც და ბოსისაც) =====
// owner: "player" ან "boss" — ვისია ტყვია (ამაზეა დამოკიდებული გარეგნობა)
import { GAME_WIDTH, GAME_HEIGHT, color } from "../config.js";

export class Bullet {
    constructor({ x, y, vx = 0, vy, radius = 2, color: colorName = "white", damage = 1, owner = "player" }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color(colorName);
        this.damage = damage;
        this.owner = owner;
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
        const size = Math.max(2, Math.round(this.radius * 2));
        const x = Math.round(this.x - size / 2);
        const y = Math.round(this.y - size / 2);

        if (this.owner === "player") {
            // მოთამაშის ტყვია: წაგრძელებული "ლაზერი"
            ctx.fillStyle = this.color;
            ctx.fillRect(x, y - size, size, size * 3);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + Math.floor(size / 4), y - size + 1, Math.max(1, Math.floor(size / 2)), size);
        } else {
            // ბოსის ტყვია: კვადრატი თეთრი ბირთვით
            ctx.fillStyle = this.color;
            ctx.fillRect(x, y, size, size);
            ctx.fillStyle = "#ffffff";
            const core = Math.max(1, Math.floor(size / 2));
            ctx.fillRect(x + Math.floor((size - core) / 2), y + Math.floor((size - core) / 2), core, core);
        }
    }
}
