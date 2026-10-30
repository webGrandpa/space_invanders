// ========================================
// HUD — ქულა, სიცოცხლე, იარაღი და შეტყობინებები კანვასზე
// ========================================

import { GAME_WIDTH, GAME_HEIGHT, WEAPONS, color } from "../config.js";
import { isMuted } from "../core/audio.js";

const FONT = "'Press Start 2P', 'Noto Sans Georgian'";

function text(ctx, value, x, y, { size = 8, fill = "white", align = "left", baseline = "top" } = {}) {
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = color(fill);
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(value, x, y);
}

export function drawHud(ctx, game) {
    drawShield(ctx, game);
    drawTopBar(ctx, game);
    drawWeapon(ctx, game);
    drawLevelInfo(ctx, game);
    drawEffects(ctx, game);
    drawMessage(ctx, game);
    drawWarning(ctx, game);
}

function drawShield(ctx, game) {
    if (!game.hasEffect("shield")) return;
    const { x, y } = game.player;
    ctx.strokeStyle = color("cyan");
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6 + Math.sin(game.realTime * 10) * 0.2;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawTopBar(ctx, game) {
    text(ctx, `SCORE: ${game.score}`, 10, 10, { fill: "cyan" });
    text(ctx, `HP: ${game.health}%`, GAME_WIDTH - 10, 10, { fill: "red", align: "right" });
    if (isMuted()) text(ctx, "MUTE", GAME_WIDTH / 2, 10, { fill: "gray", align: "center" });
}

function drawWeapon(ctx, game) {
    const { weaponLevel, weapon } = game.player;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 16;
    text(ctx, `LV.${weaponLevel} ${weapon.name}`, x, y, { fill: weapon.color, align: "center", baseline: "middle" });

    const dotsWidth = WEAPONS.length * 6;
    for (let i = 0; i < WEAPONS.length; i++) {
        ctx.fillStyle = i < weaponLevel ? color(weapon.color) : "rgba(255,255,255,0.15)";
        ctx.fillRect(x - dotsWidth / 2 + i * 6, y + 7, 4, 2);
    }
}

function drawLevelInfo(ctx, game) {
    const difficulty = game.difficulty;
    const right = GAME_WIDTH - 10;
    text(ctx, difficulty.label, right, GAME_HEIGHT - 24, { fill: difficulty.color, align: "right" });
    text(ctx, `STAGE ${game.levelIndex + 1}/${game.levelCount}`, right, GAME_HEIGHT - 14, {
        fill: "gray",
        align: "right",
    });
}

function drawEffects(ctx, game) {
    let y = 26;
    const effects = [
        ["rapid_fire", "RAPID", "yellow"],
        ["shield", "SHIELD", "cyan"],
    ];
    for (const [name, label, fill] of effects) {
        if (!game.hasEffect(name)) continue;
        text(ctx, `${label} ${game.effectTimeLeft(name).toFixed(1)}s`, 10, y, { fill });
        y += 12;
    }
}

function drawMessage(ctx, game) {
    const message = game.message;
    if (!message || game.time > message.until) return;
    const timeLeft = message.until - game.time;
    ctx.globalAlpha = Math.min(1, timeLeft / 0.5);
    const rise = (1.5 - timeLeft) * 12;
    text(ctx, message.text, game.player.x, game.player.y - 24 - rise, {
        fill: message.color,
        align: "center",
        baseline: "middle",
    });
    ctx.globalAlpha = 1;
}

function drawWarning(ctx, game) {
    const warning = game.warning;
    if (!warning || game.time > warning.until) return;
    const timeLeft = warning.until - game.time;
    ctx.globalAlpha = Math.min(1, timeLeft);
    const shake = timeLeft > 2 ? (Math.random() - 0.5) * 3 : 0;
    const centerY = GAME_HEIGHT / 2;
    text(ctx, "WARNING", GAME_WIDTH / 2 + shake, centerY - 14, {
        size: 16,
        fill: "red",
        align: "center",
        baseline: "middle",
    });
    text(ctx, warning.text, GAME_WIDTH / 2, centerY + 8, { fill: "yellow", align: "center", baseline: "middle" });
    ctx.globalAlpha = 1;
}

export function drawPauseOverlay(ctx, game) {
    ctx.fillStyle = "rgba(11, 11, 26, 0.7)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    text(ctx, "PAUSED", centerX, centerY - 16, { size: 16, fill: "cyan", align: "center", baseline: "middle" });
    text(ctx, "ESC - გაგრძელება", centerX, centerY + 12, { fill: "gray", align: "center", baseline: "middle" });
    text(
        ctx,
        `${game.difficulty.label} | STAGE ${game.levelIndex + 1}/${game.levelCount} | LV.${game.player.weaponLevel}`,
        centerX,
        centerY + 32,
        { fill: "slate", align: "center", baseline: "middle" },
    );
}
