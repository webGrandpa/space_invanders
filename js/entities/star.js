// ===== Star — ფონის ვარსკვლავი =====
import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";
import { random } from "../core/collision.js";

export class Star {
    constructor() {
        this.x = random(0, GAME_WIDTH);
        this.y = random(0, GAME_HEIGHT);
        this.speed = random(3, 15);
        // ახლო ვარსკვლავები უფრო სწრაფია, დიდი და კაშკაშა
        this.size = this.speed > 11 ? 2 : 1;
        this.alpha = random(0.3, 1);
        this.twinkle = random(1, 4);
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y > GAME_HEIGHT) {
            this.y = 0;
            this.x = random(0, GAME_WIDTH);
        }
    }

    draw(ctx, time) {
        ctx.globalAlpha = this.alpha * (0.7 + Math.sin(time * this.twinkle) * 0.3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
        ctx.globalAlpha = 1;
    }
}
