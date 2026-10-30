// ========================================
// Boss — ყველა ბოსის საბაზისო კლასი
//
// ახალი ბოსი ამ კლასს აფართოებს (extends Boss) და აღწერს:
//   static config = { name, image, hp, ... }  — პარამეტრები
//   attacks = [ () => ..., () => ... ]         — შეტევები, რიგრიგობით
//
// ნიმუში: js/bosses/_template.js
// ========================================

import { GAME_WIDTH, GAME_HEIGHT, color } from "../config.js";
import { getSprite, drawSprite } from "../core/assets.js";
import { clamp, random } from "../core/collision.js";
import { drawPixelFrame, fontFor, wrapText } from "../ui/draw.js";
import { Bullet } from "../entities/bullet.js";
import { Enemy } from "../entities/enemy.js";

// პარამეტრები, რომლებიც config-ში შეიძლება არ დაწერო
const DEFAULTS = {
    width: 100,
    height: 100,
    hp: 500,
    speed: 72, // პიქსელი/წამში
    shootCooldown: 1.5, // წამი შეტევებს შორის
    talkInterval: 10, // წამი ფრაზებს შორის
    talkLines: [],
    finalWords: "...",
    color: "purple", // გამოიყენება, თუ სურათი ვერ ჩაიტვირთა
};

export class Boss {
    // შვილობილი კლასი ამას თავისით ცვლის
    static config = {};

    // შეტევების სია — შვილობილი კლასი ავსებს
    attacks = [];

    constructor(game) {
        this.game = game;
        this.config = { ...DEFAULTS, ...this.constructor.config };
        const { difficulty } = game;

        this.name = this.config.name ?? this.constructor.name;
        this.width = this.config.width;
        this.height = this.config.height;
        this.x = GAME_WIDTH / 2;
        this.y = -this.height / 2;

        this.maxHealth = Math.round(this.config.hp * difficulty.bossHpMul);
        this.health = this.maxHealth;
        this.speed = this.config.speed;
        this.vx = (Math.random() < 0.5 ? -1 : 1) * this.speed;
        this.vy = 14;

        this.shootCooldown = this.config.shootCooldown * difficulty.bossShootCooldownMul;
        this.shootTimer = 0;
        this.attackIndex = 0;
        this.talkTimer = 0;

        this.enteredScreen = false;
        this.isDying = false;
        this.dialogue = null; // { text, until }
        this.healthTriggers = [];
        this.flash = 0;
    }

    // ========== ციკლი ==========

    update(dt) {
        this.flash = Math.max(0, this.flash - dt);
        if (this.isDying) return;
        this.move(dt);

        if (this.enteredScreen) {
            this.shootTimer += dt;
            if (this.shootTimer >= this.shootCooldown) {
                this.shootTimer = 0;
                this.attack();
            }
        }

        this.talkTimer += dt;
        if (this.talkTimer > this.config.talkInterval && this.config.talkLines.length > 0) {
            this.talkTimer = random(-2, 0); // ცოტა შემთხვევითობა
            const lines = this.config.talkLines;
            this.say(lines[Math.floor(Math.random() * lines.length)]);
        }
    }

    move(dt) {
        // vx-ის მხოლოდ მიმართულებას ვიყენებთ — სიჩქარე this.speed-იდან მოდის,
        // ამიტომ this.speed-ის შეცვლა მაშინვე მოქმედებს
        this.vx = Math.sign(this.vx) * this.speed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.y > this.height / 2 + 12) this.enteredScreen = true;

        // კედლებს ეხეთქება
        if (this.x - this.width / 2 < 0) this.vx = Math.abs(this.vx);
        if (this.x + this.width / 2 > GAME_WIDTH) this.vx = -Math.abs(this.vx);

        // ეკრანის ზედა ნახევარში რჩება
        if (this.enteredScreen) {
            if (this.y - this.height / 2 < 12) this.vy = Math.abs(this.vy);
            if (this.y + this.height / 2 > GAME_HEIGHT * 0.45) this.vy = -Math.abs(this.vy);
        }
    }

    // შემდეგ შეტევას ასრულებს სიიდან
    attack() {
        if (this.attacks.length === 0) return;
        this.attacks[this.attackIndex]();
        this.attackIndex = (this.attackIndex + 1) % this.attacks.length;
    }

    takeDamage(amount) {
        if (this.isDying) return;
        this.health = Math.max(0, this.health - amount);
        this.flash = 0.05;
        for (const trigger of this.healthTriggers) {
            if (!trigger.done && this.health <= this.maxHealth * trigger.ratio) {
                trigger.done = true;
                trigger.fn();
            }
        }
    }

    // ========== დამხმარეები შეტევებისთვის ==========

    // ერთი ტყვია ნებისმიერი მიმართულებით. დანარჩენი fire* მეთოდები ამას იყენებს.
    shoot({ x = this.x, y = this.y, vx = 0, vy, radius = 3, color = "red", damage = 10 }) {
        const speedMul = this.game.difficulty.bossBulletSpeedMul;
        this.game.enemyBullets.push(
            new Bullet({ x, y, vx: vx * speedMul, vy: vy * speedMul, radius, color, damage, owner: "boss" }),
        );
    }

    // ტყვია პირდაპირ მოთამაშისკენ
    fireAimed({ speed = 120, radius, color, damage }) {
        const { player } = this.game;
        const startY = this.bottom - 8;
        const angle = Math.atan2(player.y - startY, player.x - this.x);
        this.shoot({
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius,
            color,
            damage,
        });
    }

    // მარაოსავით გაშლილი ტყვიები ქვემოთ. angle — მთლიანი გაშლის კუთხე რადიანებში.
    fireSpread({ count = 3, angle = 0.8, speed = 100, radius, color, damage }) {
        for (let i = 0; i < count; i++) {
            const a = count === 1 ? 0 : -angle / 2 + (angle / (count - 1)) * i;
            this.shoot({
                x: this.x + Math.sin(a) * 12,
                y: this.bottom - 8,
                vx: Math.sin(a) * speed,
                vy: Math.cos(a) * speed,
                radius,
                color,
                damage,
            });
        }
    }

    // წრეზე თანაბრად გაფანტული ტყვიები. offset — წრის მობრუნება (სპირალისთვის).
    fireCircle({ count = 8, speed = 80, offset = 0, radius, color, damage }) {
        for (let i = 0; i < count; i++) {
            const a = offset + ((Math.PI * 2) / count) * i;
            this.shoot({
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius,
                color,
                damage,
            });
        }
    }

    // ტყვია თითქმის პირდაპირ ქვემოთ. spreadX — რამდენად შორს ცენტრიდან შეიძლება გაჩნდეს.
    fireDown({ spreadX = 0, speed = 110, radius, color, damage }) {
        this.shoot({
            x: this.x + random(-spreadX, spreadX),
            y: this.bottom - 8,
            vx: random(-18, 18),
            vy: speed,
            radius,
            color,
            damage,
        });
    }

    // fn-ს `count`-ჯერ იმეორებს, ყოველ `delay` წამში
    burst({ count = 4, delay = 0.13 }, fn) {
        for (let i = 1; i <= count; i++) this.after(delay * i, fn);
    }

    // fn გაეშვება `seconds` წამში (თუ ბოსი მანამდე არ მოკვდა)
    after(seconds, fn) {
        this.game.timers.after(seconds, () => {
            if (!this.isDying && this.game.boss === this) fn();
        });
    }

    // პატარა მეტეორებს იძახებს ბოსის ქვემოთ
    summonMinions({ count = 2, tier = 1 } = {}) {
        const speedMul = this.game.difficulty.enemySpeedMul;
        for (let i = 0; i < count; i++) {
            const x = this.x + (i - (count - 1) / 2) * 32;
            this.game.enemies.push(new Enemy({ x, y: this.bottom, tier, speedMul }));
        }
    }

    // ეკრანის ზედა ნაწილში შემთხვევით ადგილას გადახტება
    teleport({ color = "pink" } = {}) {
        this.game.spawnParticles(this.x, this.y, color, 10);
        this.x = random(this.width / 2, GAME_WIDTH - this.width / 2);
        this.y = random(this.height / 2 + 12, Math.max(this.height / 2 + 12, GAME_HEIGHT * 0.45 - this.height / 2));
        this.game.spawnParticles(this.x, this.y, color, 10);
    }

    // fn ერთხელ გაეშვება, როცა სიცოცხლე `ratio`-ზე ქვემოთ ჩამოვა (0.5 = 50%)
    onHealthBelow(ratio, fn) {
        this.healthTriggers.push({ ratio, fn, done: false });
    }

    // ბოსი ლაპარაკობს — ტექსტი ბუშტში `seconds` წამი ჩანს
    say(text, seconds = 4) {
        this.dialogue = { text, until: this.game.time + seconds };
    }

    get bottom() {
        return this.y + this.height / 2;
    }

    get top() {
        return this.y - this.height / 2;
    }

    // ========== ხატვა ==========

    // ბუშტი (drawDialogue) ცალკე იხატება, ყველაფრის ბოლოს — იხ. Game.draw()
    draw(ctx) {
        this.drawBody(ctx);
    }

    // შვილობილ კლასს შეუძლია გადაფაროს (override), თუ სხვა გარეგნობა უნდა
    drawBody(ctx) {
        // მოხვედრისას ან სიკვდილისას თეთრად "ციმციმებს"
        const flashing = this.flash > 0 || (this.isDying && Math.floor(this.game.time * 12) % 2);
        const sprite = getSprite(this.config.image, this.width, this.height, flashing ? "#ffffff" : null);
        // სიკვდილისას კანკალებს
        const shake = this.isDying ? random(-2, 2) : 0;
        if (sprite) {
            drawSprite(ctx, sprite, this.x + shake, this.y);
        } else {
            ctx.fillStyle = flashing ? "#ffffff" : color(this.config.color);
            ctx.fillRect(Math.round(this.x - this.width / 2 + shake), Math.round(this.top), this.width, this.height);
        }
    }

    // კომიქსის "ბუშტი" ბოსის ქვემოთ
    drawDialogue(ctx) {
        if (!this.dialogue || this.game.time > this.dialogue.until) return;

        ctx.font = fontFor(this.dialogue.text);
        const lines = wrapText(ctx, this.dialogue.text, 160);
        const lineHeight = 12;
        const width = Math.ceil(Math.max(...lines.map((line) => ctx.measureText(line).width))) + 12;
        const height = lines.length * lineHeight + 8;
        const float = this.isDying ? 0 : Math.round(Math.sin(this.game.time * 3) * 2);
        const left = Math.round(clamp(this.x - width / 2, 4, GAME_WIDTH - width - 4));
        const top = Math.round(this.bottom + 10 + float);
        const tailX = Math.round(clamp(this.x, left + 6, left + width - 6));

        drawPixelFrame(ctx, left + 2, top + 2, width, height, { fill: "slate", border: "slate" });
        drawPixelFrame(ctx, left, top, width, height, { fill: "white", border: "black" });
        // საფეხურებიანი "კუდი" ბოსისკენ
        ctx.fillStyle = color("white");
        ctx.fillRect(tailX - 2, top - 1, 4, 2);
        ctx.fillRect(tailX - 1, top - 3, 2, 2);
        ctx.fillRect(tailX, top - 5, 1, 2);

        ctx.fillStyle = color("black");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        lines.forEach((line, i) => {
            ctx.fillText(line, left + width / 2, top + 4 + i * lineHeight + lineHeight / 2);
        });
    }
}
