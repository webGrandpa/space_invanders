// ========================================
// Debug რეჟიმი — ჩაირთვება, თუ მისამართს ბოლოში ?debug მიუწერ:
//   http://localhost:8080/?debug
//
// ღილაკები თამაშის დროს:
//   1-9  პირდაპირ N-ე ბოსთან გადასვლა
//   G    უკვდავება (დაზიანება არ მოქმედებს)
//   H    hitbox-ების ჩვენება (რა ზომით "ეჯახება" ობიექტები ერთმანეთს)
//   K    ბოსს სიცოცხლე 10%-მდე ჩამოუვა
//   U    იარაღის დონის აწევა
//
// კონსოლში `game` ობიექტიც ხელმისაწვდომია, მაგ.: game.health = 100
// ========================================

import { GAME_WIDTH } from "../config.js";
import { drawText } from "../ui/draw.js";

export function setupDebug(game) {
    window.game = game;
    game.debug = { godMode: false, hitboxes: false, fps: 60 };

    game.input.onKeyPress((code) => {
        if (game.state !== "playing") return;

        const digit = code.match(/^Digit([1-9])$/);
        if (digit) jumpToBoss(game, Number(digit[1]) - 1);

        if (code === "KeyG") {
            game.debug.godMode = !game.debug.godMode;
            game.showMessage(game.debug.godMode ? "GOD MODE ON" : "GOD MODE OFF", "pink");
        }
        if (code === "KeyH") game.debug.hitboxes = !game.debug.hitboxes;
        if (code === "KeyK" && game.boss) game.boss.takeDamage(game.boss.health - game.boss.maxHealth * 0.1);
        if (code === "KeyU") game.showMessage(game.upgradeWeapon(), "lime");
    });
}

function jumpToBoss(game, index) {
    if (index >= game.levelCount) return;
    game.boss = null;
    game.enemies = [];
    game.enemyBullets = [];
    game.startLevel(index);
    game.spawnBoss();
}

export function drawDebug(ctx, game) {
    const { debug } = game;
    // FPS — კადრები წამში (გლუვად ვაშუალებთ)
    debug.fps = debug.fps * 0.95 + (1 / Math.max(game.lastDt, 0.001)) * 0.05;

    const entities =
        game.bullets.length + game.enemyBullets.length + game.enemies.length + game.particles.length;
    drawText(ctx, `FPS ${Math.round(debug.fps)}  OBJ ${entities}`, GAME_WIDTH / 2, 40, {
        fill: "pink",
        align: "center",
    });
    if (debug.godMode) drawText(ctx, "GOD", GAME_WIDTH / 2, 52, { fill: "pink", align: "center" });

    if (!debug.hitboxes) return;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#ff5cd6";
    const circles = [game.player, ...game.enemies, ...game.bullets, ...game.enemyBullets, ...game.powerUps];
    for (const { x, y, radius } of circles) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    const boss = game.boss;
    if (boss) ctx.strokeRect(boss.x - boss.width / 2, boss.top, boss.width, boss.height);
}
