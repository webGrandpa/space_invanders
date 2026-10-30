// ========================================
// HUD — ქულა, სიცოცხლე, იარაღი და შეტყობინებები კანვასზე
// ========================================

import { GAME_WIDTH, GAME_HEIGHT, PLAYER, POWERUPS, WEAPONS, color } from "../config.js";
import { isMuted } from "../core/audio.js";
import { drawIcon, drawPixelFrame, drawText } from "./draw.js";

const MARGIN = 8;

export function drawHud(ctx, game) {
    drawShield(ctx, game);
    drawHurtFlash(ctx, game);
    drawScore(ctx, game);
    drawHealth(ctx, game);
    drawBossBar(ctx, game);
    drawEffects(ctx, game);
    drawWeapon(ctx, game);
    drawStage(ctx, game);
    drawMessage(ctx, game);
    drawBanner(ctx, game);
}

function drawShield(ctx, game) {
    if (!game.hasEffect("shield")) return;
    const { x, y } = game.player;
    // ბოლო წამში ციმციმებს
    if (game.effectTimeLeft("shield") < 1 && Math.floor(game.realTime * 10) % 2) return;
    ctx.strokeStyle = color("cyan");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(Math.round(x) + 0.5, Math.round(y) + 0.5, 17, 0, Math.PI * 2);
    ctx.stroke();
}

function drawHurtFlash(ctx, game) {
    if (game.time > game.hurtUntil) return;
    ctx.globalAlpha = ((game.hurtUntil - game.time) / 0.25) * 0.3;
    ctx.fillStyle = color("red");
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.globalAlpha = 1;
}

function drawScore(ctx, game) {
    drawText(ctx, "SCORE", MARGIN, MARGIN, { fill: "gray" });
    drawText(ctx, String(game.score).padStart(6, "0"), MARGIN + 48, MARGIN, { fill: "white" });
    drawText(ctx, "HI", MARGIN, MARGIN + 12, { fill: "gray" });
    drawText(ctx, String(Math.max(game.score, game.highScore)).padStart(6, "0"), MARGIN + 48, MARGIN + 12, {
        fill: "yellow",
    });
    if (isMuted()) drawText(ctx, "MUTE", MARGIN, MARGIN + 24, { fill: "slate" });
}

// 10 უჯრედიანი სიცოცხლის ზოლი
function drawHealth(ctx, game) {
    const cells = 10;
    const cellWidth = 6;
    const right = GAME_WIDTH - MARGIN;
    const left = right - cells * (cellWidth + 1) + 1;
    const ratio = game.health / PLAYER.maxHealth;
    const filled = Math.ceil(ratio * cells);
    const fill = ratio > 0.5 ? "green" : ratio > 0.25 ? "yellow" : "red";
    // სიცოცხლე ცოტაა — ზოლი ციმციმებს
    const blink = ratio <= 0.25 && Math.floor(game.realTime * 4) % 2;

    drawText(ctx, "HP", left - 6, MARGIN, { fill: "gray", align: "right" });
    for (let i = 0; i < cells; i++) {
        ctx.fillStyle = color(i < filled && !blink ? fill : "navy");
        ctx.fillRect(left + i * (cellWidth + 1), MARGIN, cellWidth, 8);
    }
}

// ბოსის სიცოცხლე ეკრანის თავში, როგორც კლასიკურ არკადაში
function drawBossBar(ctx, game) {
    const boss = game.boss;
    if (!boss) return;
    const width = 240;
    const left = Math.round((GAME_WIDTH - width) / 2);
    const top = MARGIN + 12;
    const ratio = boss.health / boss.maxHealth;

    drawText(ctx, boss.name, left, top - 12, { fill: "red" });
    drawText(ctx, `${Math.ceil(ratio * 100)}%`, left + width, top - 12, { fill: "gray", align: "right" });
    drawPixelFrame(ctx, left - 1, top - 1, width + 2, 8, { fill: "night", border: "slate" });
    ctx.fillStyle = color(ratio > 0.5 ? "red" : ratio > 0.25 ? "orange" : "yellow");
    ctx.fillRect(left + 1, top + 1, Math.ceil((width - 2) * ratio), 4);
}

function drawEffects(ctx, game) {
    let y = GAME_HEIGHT - MARGIN - 28;
    for (const name of ["rapid_fire", "shield"]) {
        if (!game.hasEffect(name)) continue;
        const { icon, color: fill } = POWERUPS[name];
        drawIcon(ctx, icon, MARGIN, y, fill);
        drawText(ctx, `${game.effectTimeLeft(name).toFixed(1)}`, MARGIN + 11, y, { fill });
        y -= 12;
    }
}

function drawWeapon(ctx, game) {
    const { weaponLevel, weapon } = game.player;
    const bottom = GAME_HEIGHT - MARGIN;
    drawText(ctx, weapon.name, MARGIN, bottom - 16, { fill: weapon.color });
    for (let i = 0; i < WEAPONS.length; i++) {
        ctx.fillStyle = color(i < weaponLevel ? weapon.color : "navy");
        ctx.fillRect(MARGIN + i * 7, bottom - 3, 6, 3);
    }
}

function drawStage(ctx, game) {
    const right = GAME_WIDTH - MARGIN;
    const bottom = GAME_HEIGHT - MARGIN;
    const difficulty = game.difficulty;
    drawText(ctx, difficulty.label, right, bottom - 20, { fill: difficulty.color, align: "right" });
    drawText(ctx, `STAGE ${game.levelIndex + 1}/${game.levelCount}`, right, bottom - 8, {
        fill: "gray",
        align: "right",
    });
}

// "+25 HP" და მსგავსი წარწერა ხომალდის თავზე
function drawMessage(ctx, game) {
    const message = game.message;
    if (!message || game.time > message.until) return;
    const timeLeft = message.until - game.time;
    const rise = Math.round((1.5 - timeLeft) * 12);
    if (timeLeft < 0.4 && Math.floor(timeLeft * 16) % 2) return;
    drawText(ctx, message.text, game.player.x, game.player.y - 22 - rise, {
        fill: message.color,
        align: "center",
        baseline: "middle",
        shadow: "black",
    });
}

// დიდი წარწერა ეკრანის შუაში: "STAGE 1", "WARNING", "STAGE CLEAR"
function drawBanner(ctx, game) {
    const banner = game.banner;
    if (!banner || game.time > banner.until) return;
    const elapsed = banner.duration - (banner.until - game.time);
    const centerY = Math.round(GAME_HEIGHT / 2 - 20);
    const isWarning = banner.style === "warning";

    // ზოლი იხსნება შუიდან და ბოლოს იკეცება
    const open = Math.min(1, elapsed / 0.15, (banner.until - game.time) / 0.15);
    const height = Math.round(44 * open);
    if (height < 2) return;

    ctx.fillStyle = "rgba(11, 11, 26, 0.85)";
    ctx.fillRect(0, centerY - height / 2, GAME_WIDTH, height);
    if (isWarning) drawHazardStripes(ctx, centerY - height / 2, centerY + height / 2 - 4, game.realTime);
    if (open < 1) return;

    // WARNING ციმციმებს
    const titleVisible = !isWarning || Math.floor(elapsed * 4) % 2 === 0;
    if (titleVisible) {
        drawText(ctx, banner.title, GAME_WIDTH / 2, centerY - 6, {
            size: 16,
            fill: isWarning ? "red" : "cyan",
            align: "center",
            baseline: "middle",
            shadow: "navy",
        });
    }
    drawText(ctx, banner.subtitle, GAME_WIDTH / 2, centerY + 12, {
        fill: isWarning ? "yellow" : "white",
        align: "center",
        baseline: "middle",
    });
}

// ყვითელ-შავი "საშიშროების" ზოლები, რომლებიც მოძრაობს
function drawHazardStripes(ctx, topY, bottomY, time) {
    const offset = Math.floor(time * 30) % 16;
    for (const y of [topY, bottomY]) {
        ctx.fillStyle = color("yellow");
        ctx.fillRect(0, y, GAME_WIDTH, 4);
        ctx.fillStyle = color("black");
        for (let x = -16 + offset; x < GAME_WIDTH; x += 16) {
            for (let row = 0; row < 4; row++) ctx.fillRect(x + row, y + row, 8, 1);
        }
    }
}

export function drawPauseOverlay(ctx, game) {
    ctx.fillStyle = "rgba(11, 11, 26, 0.75)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    drawText(ctx, "PAUSED", centerX, centerY - 20, {
        size: 16,
        fill: "cyan",
        align: "center",
        baseline: "middle",
        shadow: "navy",
    });
    if (Math.floor(game.realTime * 2) % 2 === 0) {
        drawText(ctx, "PRESS ESC", centerX, centerY + 8, { fill: "white", align: "center", baseline: "middle" });
    }
    drawText(
        ctx,
        `${game.difficulty.label}  STAGE ${game.levelIndex + 1}/${game.levelCount}  LV.${game.player.weaponLevel}`,
        centerX,
        centerY + 32,
        { fill: "gray", align: "center", baseline: "middle" },
    );
    drawText(ctx, "M - ხმა   C - CRT ეფექტი", centerX, centerY + 50, {
        fill: "slate",
        align: "center",
        baseline: "middle",
    });
}
