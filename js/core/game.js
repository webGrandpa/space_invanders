// ========================================
// Game — თამაშის "ტვინი"
// ინახავს ყველა ობიექტს, ატრიალებს ციკლს (update → draw) და მართავს ლეველებს.
//
// მდგომარეობები (state):
//   "menu" → "playing" ⇄ "paused" → "gameover" / "victory" → "menu"
// ========================================

import { GAME_WIDTH, GAME_HEIGHT, PALETTE, DIFFICULTIES, PLAYER, POWERUPS, WEAPONS } from "../config.js";
import { LEVELS, LEVEL_DEFAULTS } from "../levels.js";
import { Timers } from "./timers.js";
import { Input } from "./input.js";
import { circlesOverlap, circleRectOverlap } from "./collision.js";
import { sfx, startMusic, stopMusic, pauseAudio, resumeAudio, toggleMute, unlockAudio } from "./audio.js";
import { Player } from "../entities/player.js";
import { Enemy } from "../entities/enemy.js";
import { Particle } from "../entities/particle.js";
import { PowerUp } from "../entities/powerup.js";
import { Star } from "../entities/star.js";
import { drawHud, drawPauseOverlay } from "../ui/hud.js";

const BOSS_DEATH_DURATION = 4; // წამი ბოსის სიკვდილის ანიმაციისთვის

export class Game {
    constructor(canvas, screens) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.screens = screens;
        this.input = new Input(canvas);
        this.stars = Array.from({ length: 90 }, () => new Star());
        this.state = "menu";
        this.difficultyKey = "middle";
        this.realTime = 0; // ყოველთვის მიდის, პაუზაზეც (ანიმაციებისთვის)

        this.reset();
        this.input.onKeyPress((code) => this.handleKey(code));
        window.addEventListener("resize", () => this.resize());
        this.resize();
    }

    // ყველაფერს თავიდან აყენებს ახალი თამაშისთვის
    reset() {
        this.timers = new Timers();
        this.player = new Player();
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];

        this.boss = null;
        this.bossDeathTimer = 0;
        this.levelIndex = 0;
        this.levelStartTime = 0;
        this.spawnTimer = 0;

        this.score = 0;
        this.health = PLAYER.maxHealth;
        this.kills = 0;
        this.effects = {}; // ეფექტის სახელი → დასრულების დრო
        this.weaponDropsLeft = 0;
        this.message = null; // { text, color, until }
        this.warning = null; // { text, until }
    }

    // ========== მოსახერხებელი getter-ები ==========

    // თამაშის საათი წამებში. პაუზაზე ჩერდება.
    get time() {
        return this.timers.time;
    }

    get difficulty() {
        return DIFFICULTIES[this.difficultyKey];
    }

    get level() {
        return { ...LEVEL_DEFAULTS, ...LEVELS[this.levelIndex] };
    }

    get levelCount() {
        return LEVELS.length;
    }

    get meteorTime() {
        return this.level.meteorTime * this.difficulty.meteorTimeMul;
    }

    get enemySpeedMul() {
        return this.difficulty.enemySpeedMul * this.level.enemySpeedMul;
    }

    get spawnInterval() {
        return this.difficulty.enemySpawnInterval / this.level.spawnRateMul;
    }

    // ========== მდგომარეობის მართვა ==========

    start(difficultyKey) {
        unlockAudio();
        this.reset();
        this.difficultyKey = difficultyKey;
        this.startLevel(0);
        this.state = "playing";
        this.screens.hide();
        startMusic();
    }

    startLevel(index) {
        this.levelIndex = index;
        this.levelStartTime = this.time;
        this.spawnTimer = this.spawnInterval;
        this.weaponDropsLeft = this.difficulty.weaponDropsPerLevel;
    }

    togglePause() {
        if (this.state === "playing") {
            this.state = "paused";
            pauseAudio();
        } else if (this.state === "paused") {
            this.state = "playing";
            resumeAudio();
        }
    }

    endGame() {
        this.state = "gameover";
        stopMusic();
        this.screens.show("gameover", { score: this.score });
    }

    win() {
        this.state = "victory";
        stopMusic();
        this.screens.show("victory", { score: this.score });
    }

    returnToMenu() {
        this.reset();
        this.state = "menu";
        this.screens.show("menu");
    }

    handleKey(code) {
        if (code === "Escape" || code === "KeyP") this.togglePause();
        if (code === "KeyM") toggleMute();
    }

    // ========== მთავარი ციკლი ==========

    run() {
        let last = performance.now();
        const frame = (now) => {
            // dt — წინა კადრიდან გასული დრო წამებში (მაქს. 1/30, რომ "ნახტომი" არ მოხდეს)
            const dt = Math.min((now - last) / 1000, 1 / 30);
            last = now;
            this.update(dt);
            this.draw();
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }

    update(dt) {
        this.realTime += dt;
        this.stars.forEach((star) => star.update(dt));

        if (this.state === "gameover" || this.state === "victory") {
            this.particles.forEach((p) => p.update(dt));
            this.cleanup();
        }
        if (this.state !== "playing") return;

        this.timers.update(dt);
        this.updateLevel(dt);

        this.player.update(dt, this.input);
        if (this.input.firing) this.fire();

        this.boss?.update(dt);
        this.updateBossDeath(dt);

        for (const list of [this.bullets, this.enemyBullets, this.enemies, this.particles, this.powerUps]) {
            list.forEach((entity) => entity.update(dt));
        }

        this.handleCollisions();
        this.cleanup();
    }

    // მეტეორების გაჩენა და ბოსის გამოძახება
    updateLevel(dt) {
        if (this.boss) return;

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.spawnInterval;
            this.enemies.push(new Enemy({ speedMul: this.enemySpeedMul }));
        }

        if (this.time - this.levelStartTime >= this.meteorTime) this.spawnBoss();
    }

    spawnBoss() {
        const BossClass = this.level.boss;
        this.boss = new BossClass(this);
        this.warning = { text: `BOSS ${this.levelIndex + 1}: ${this.boss.name}`, until: this.time + 3 };
        sfx.warning();
    }

    killBoss() {
        this.boss.isDying = true;
        this.boss.say(this.boss.config.finalWords, BOSS_DEATH_DURATION);
        this.bossDeathTimer = 0;
    }

    updateBossDeath(dt) {
        if (!this.boss?.isDying) return;
        this.bossDeathTimer += dt;
        if (this.bossDeathTimer < BOSS_DEATH_DURATION) return;

        const { x, y } = this.boss;
        this.explode(x, y, "yellow");
        this.explode(x - 20, y + 12, "orange");
        this.explode(x + 20, y - 12, "red");
        sfx.bigExplosion();
        this.addScore((2000 + this.levelIndex * 1500) * this.difficulty.scoreMul);

        this.boss = null;
        this.enemyBullets = [];
        if (this.levelIndex + 1 >= LEVELS.length) this.win();
        else this.startLevel(this.levelIndex + 1);
    }

    fire() {
        const cooldownMul = this.hasEffect("rapid_fire") ? 0.5 : 1;
        const bullets = this.player.shoot(this.time, cooldownMul);
        if (bullets.length === 0) return;
        this.bullets.push(...bullets);
        sfx.laser();
    }

    // ========== შეჯახებები ==========

    handleCollisions() {
        const { player, boss } = this;
        const shielded = this.hasEffect("shield");

        // ბოსს შეეჯახე — მყისიერი სიკვდილი
        if (boss && !shielded && circleRectOverlap(player, boss)) {
            this.explode(player.x, player.y, "red");
            this.health = 0;
            this.endGame();
            return;
        }

        // შენი ტყვიები → ბოსი
        if (boss && !boss.isDying) {
            for (const bullet of this.bullets) {
                if (bullet.dead || !circleRectOverlap(bullet, boss)) continue;
                bullet.dead = true;
                boss.takeDamage(bullet.damage);
                this.spawnParticles(bullet.x, bullet.y, bullet.color, 4);
                sfx.hit();
                if (boss.health <= 0) {
                    this.killBoss();
                    break;
                }
            }
        }

        // ბოსის ტყვიები → შენ
        for (const bullet of this.enemyBullets) {
            if (!circlesOverlap(bullet, player)) continue;
            bullet.dead = true;
            if (shielded) {
                this.spawnParticles(bullet.x, bullet.y, "cyan", 6);
            } else {
                this.explode(player.x, player.y, bullet.color);
                this.takeDamage(bullet.damage);
            }
        }

        // მეტეორები → შენ, შენი ტყვიები → მეტეორები
        const fragments = [];
        for (const enemy of this.enemies) {
            if (enemy.dead) continue;

            if (circlesOverlap(enemy, player)) {
                enemy.dead = true;
                if (shielded) {
                    this.explode(enemy.x, enemy.y, "cyan");
                    this.addScore(5 * this.difficulty.scoreMul);
                } else {
                    this.explode(player.x, player.y, "red");
                    this.takeDamage(15 * enemy.tier);
                }
                continue;
            }

            for (const bullet of this.bullets) {
                if (bullet.dead || !circlesOverlap(bullet, enemy)) continue;
                bullet.dead = true;
                enemy.hp -= bullet.damage;
                this.spawnParticles(bullet.x, bullet.y, bullet.color, 3);
                if (enemy.hp <= 0) {
                    fragments.push(...this.destroyEnemy(enemy));
                    break;
                }
            }
        }
        this.enemies.push(...fragments);

        // ბონუსების აღება
        const pickupArea = { x: player.x, y: player.y, radius: 12 };
        for (const powerUp of this.powerUps) {
            if (powerUp.dead || !circlesOverlap(powerUp, pickupArea)) continue;
            powerUp.dead = true;
            this.collectPowerUp(powerUp);
        }
    }

    // აბრუნებს ნამსხვრევებს (პატარა მეტეორებს)
    destroyEnemy(enemy) {
        enemy.dead = true;
        this.kills++;
        this.explode(enemy.x, enemy.y, "yellow");
        this.addScore(10 * enemy.tier * this.difficulty.scoreMul);
        this.tryDropPowerUp(enemy.x, enemy.y);
        return enemy.split(this.enemySpeedMul);
    }

    // მკვდარ ობიექტებს სიებიდან შლის
    cleanup() {
        const alive = (entity) => !entity.dead;
        this.bullets = this.bullets.filter(alive);
        this.enemyBullets = this.enemyBullets.filter(alive);
        this.enemies = this.enemies.filter(alive);
        this.particles = this.particles.filter(alive);
        this.powerUps = this.powerUps.filter(alive);
    }

    // ========== მოთამაშის მდგომარეობა ==========

    takeDamage(amount) {
        if (this.hasEffect("shield")) return;
        this.health -= Math.round(amount * this.difficulty.damageMul);
        sfx.hurt();

        const before = this.player.weaponLevel;
        this.player.weaponLevel = Math.max(1, before - this.difficulty.weaponDowngrade);
        const lost = before - this.player.weaponLevel;
        if (lost > 0) this.showMessage(`WEAPON -${lost}`, "red");

        if (this.health <= 0) {
            this.health = 0;
            this.endGame();
        }
    }

    heal(amount) {
        this.health = Math.min(PLAYER.maxHealth, this.health + amount);
    }

    addScore(points) {
        this.score += Math.round(points);
    }

    // აბრუნებს ტექსტს, რომელიც ეკრანზე გამოჩნდება
    upgradeWeapon() {
        if (this.player.weaponLevel < WEAPONS.length) {
            this.player.weaponLevel++;
            return this.player.weapon.name;
        }
        const bonus = Math.round(500 * this.difficulty.scoreMul);
        this.addScore(bonus);
        return `+${bonus} BONUS`;
    }

    addEffect(name, seconds) {
        this.effects[name] = this.time + seconds;
    }

    hasEffect(name) {
        return this.effectTimeLeft(name) > 0;
    }

    effectTimeLeft(name) {
        return Math.max(0, (this.effects[name] ?? 0) - this.time);
    }

    showMessage(text, color) {
        this.message = { text, color, until: this.time + 1.5 };
    }

    // ========== ბონუსები ==========

    tryDropPowerUp(x, y) {
        // იარაღის გაუმჯობესება გარანტირებულად ცვივა ლეველის განმავლობაში —
        // რაც უფრო ახლოსაა ბოსი, მით მეტია შანსი
        if (!this.boss && this.weaponDropsLeft > 0) {
            const progress = (this.time - this.levelStartTime) / this.meteorTime;
            const urgency = Math.max(0.12, progress * 0.6);
            const chance = Math.min(0.7, this.weaponDropsLeft * urgency * 0.08);
            if (Math.random() < chance) {
                this.weaponDropsLeft--;
                this.powerUps.push(new PowerUp(x, y, "weapon_up"));
                return;
            }
        }

        if (Math.random() < this.difficulty.randomDropChance) {
            this.powerUps.push(new PowerUp(x, y, pickWeighted(POWERUPS)));
        }
    }

    collectPowerUp(powerUp) {
        const text = powerUp.config.apply(this);
        if (text) this.showMessage(text, powerUp.color);
        this.spawnParticles(powerUp.x, powerUp.y, powerUp.color, 8);
        sfx.powerUp();
    }

    // ========== ეფექტები ==========

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color));
    }

    explode(x, y, color) {
        this.spawnParticles(x, y, color, 15);
        sfx.explosion();
    }

    // ========== ხატვა ==========

    resize() {
        // ეკრანში რაც შეიძლება დიდი, პროპორციის შენარჩუნებით
        const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
        this.canvas.style.width = `${Math.floor(GAME_WIDTH * scale)}px`;
        this.canvas.style.height = `${Math.floor(GAME_HEIGHT * scale)}px`;
        // ბუფერი ეკრანის რეალურ პიქსელებს ემთხვევა, რომ ტექსტი მკვეთრი იყოს
        this.renderScale = Math.max(1, Math.ceil(scale * window.devicePixelRatio));
        this.canvas.width = GAME_WIDTH * this.renderScale;
        this.canvas.height = GAME_HEIGHT * this.renderScale;
    }

    draw() {
        const ctx = this.ctx;
        ctx.setTransform(this.renderScale, 0, 0, this.renderScale, 0, 0);
        ctx.fillStyle = PALETTE.black;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.stars.forEach((star) => star.draw(ctx, this.realTime));
        if (this.state === "menu") return;

        this.powerUps.forEach((p) => p.draw(ctx));
        this.enemies.forEach((e) => e.draw(ctx));
        this.boss?.draw(ctx);
        this.bullets.forEach((b) => b.draw(ctx));
        this.enemyBullets.forEach((b) => b.draw(ctx));
        if (this.state !== "gameover") this.player.draw(ctx);
        this.particles.forEach((p) => p.draw(ctx));

        drawHud(ctx, this);
        if (this.state === "paused") drawPauseOverlay(ctx, this);
    }
}

// { a: { weight: 1 }, b: { weight: 3 } } → "b" 75%-ით, "a" 25%-ით
function pickWeighted(options) {
    const entries = Object.entries(options);
    const total = entries.reduce((sum, [, option]) => sum + option.weight, 0);
    let roll = Math.random() * total;
    for (const [key, option] of entries) {
        roll -= option.weight;
        if (roll < 0) return key;
    }
    return entries[0][0];
}
