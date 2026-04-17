const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score-el");
const healthEl = document.getElementById("health-el");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");
const victoryScreen = document.getElementById("victory-screen");
const victoryScoreEl = document.getElementById("victory-score");
const playAgainBtn = document.getElementById("play-again-btn");

const sfxLaser = document.getElementById("sound-laser");
const sfxExplosion = document.getElementById("sound-explosion");
const bgMusic = document.getElementById("bg-music");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - 80;
    if (player.x > canvas.width - player.width / 2)
        player.x = canvas.width - player.width / 2;
});

const imgPlayer = new Image();
imgPlayer.src = "assets/ship.png";
const imgMeteor = new Image();
imgMeteor.src = "assets/meteor.avif";
const imgFirstBoss = new Image();
imgFirstBoss.src = "assets/firstboss.png";
const imgSecondBoss = new Image();
imgSecondBoss.src = "assets/secondboss.png";
const imgThirdBoss = new Image();
imgThirdBoss.src = "assets/thirdboss.png";
const imgFourthBoss = new Image();
imgFourthBoss.src = "assets/fourthboss.png";

let score = 0,
    health = 100,
    isGameOver = false,
    isMenu = true,
    isPaused = false;
let animationId, spawnInterval;
let projectiles = [],
    enemies = [],
    particles = [],
    stars = [],
    bossProjectiles = [],
    powerUps = [];

// ========== ბოსის პროგრესიის სისტემა ==========
let boss = null;
let currentBossIndex = 0;     // 0-3 (4 ბოსი)
let phaseStartTime = 0;       // ფაზის დაწყების დრო
let bossDefeatTimer = 0;
let allBossesDefeated = false;
let bossWarning = null;       // { name, timer }

let gameJustStarted = false;
let pickupMessage = null;
let pickupMessageTimer = 0;

const player = new Player();

// ========== კონტროლი ==========
window.addEventListener("mousemove", (e) => {
    if (!isGameOver && !isMenu && !isPaused) player.x = e.clientX;
});
window.addEventListener("mousedown", () => {
    if (gameJustStarted) {
        gameJustStarted = false;
        return;
    }
    if (!isGameOver && !isMenu && !isPaused) fireProjectile();
});
window.addEventListener("keydown", (e) => {
    // Escape — პაუზა
    if (e.code === "Escape" && !isGameOver && !isMenu) {
        e.preventDefault();
        togglePause();
        return;
    }
    if (e.code === "Space" && !isGameOver && !isMenu && !isPaused) {
        e.preventDefault();
        fireProjectile();
    }
});

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        bgMusic.pause();
        clearInterval(spawnInterval);
        // Active effects-ის ტაიმერების შეჩერება
        if (activeEffects.rapid_fire) {
            activeEffects._rapidRemaining = activeEffects.rapid_fire_end - Date.now();
        }
        if (activeEffects.shield) {
            activeEffects._shieldRemaining = activeEffects.shield_end - Date.now();
        }
    } else {
        bgMusic.play().catch(() => {});
        spawnEnemies();
        // ტაიმერების აღდგენა
        if (activeEffects.rapid_fire && activeEffects._rapidRemaining) {
            activeEffects.rapid_fire_end = Date.now() + activeEffects._rapidRemaining;
        }
        if (activeEffects.shield && activeEffects._shieldRemaining) {
            activeEffects.shield_end = Date.now() + activeEffects._shieldRemaining;
        }
    }
}

restartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    returnToMenu();
});
playAgainBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    returnToMenu();
});

function returnToMenu() {
    gameOverScreen.style.display = "none";
    victoryScreen.style.display = "none";
    isGameOver = false;
    isMenu = true;
    // selected კლასის წაშლა ყველა ღილაკიდან
    document.querySelectorAll(".diff-btn").forEach(btn => {
        btn.classList.remove("diff-btn-selected");
        btn.style.borderColor = "";
        btn.style.boxShadow = "";
    });
    startScreen.style.display = "flex";
}

// ========== სროლა ==========
function fireProjectile() {
    const now = Date.now();
    const weapon = getCurrentWeapon();

    if (now - lastFiredTime < weapon.cooldown) return;
    lastFiredTime = now;

    if (weapon.type === "single") {
        projectiles.push(new Projectile(
            player.x, player.y - 20, 0,
            weapon.speed, weapon.radius, weapon.color, weapon.damage,
        ));
    } else if (weapon.type === "dual") {
        projectiles.push(new Projectile(
            player.x - 20, player.y - 10, 0,
            weapon.speed, weapon.radius, weapon.color, weapon.damage,
        ));
        projectiles.push(new Projectile(
            player.x + 20, player.y - 10, 0,
            weapon.speed, weapon.radius, weapon.color, weapon.damage,
        ));
    } else if (weapon.type === "spread") {
        projectiles.push(new Projectile(
            player.x, player.y - 20, 0,
            weapon.speed, weapon.radius, weapon.color, weapon.damage,
        ));
        projectiles.push(new Projectile(
            player.x - 10, player.y - 15, -3,
            weapon.speed * 0.9, weapon.radius, weapon.color, weapon.damage,
        ));
        projectiles.push(new Projectile(
            player.x + 10, player.y - 15, 3,
            weapon.speed * 0.9, weapon.radius, weapon.color, weapon.damage,
        ));
    } else if (weapon.type === "ultimate") {
        const angles = [-6, -3, 0, 3, 6];
        angles.forEach((vx) => {
            projectiles.push(new Projectile(
                player.x + vx * 3, player.y - 15, vx,
                weapon.speed, weapon.radius, weapon.color, weapon.damage,
            ));
        });
    }

    sfxLaser.currentTime = 0;
    sfxLaser.volume = 0.2;
    sfxLaser.play().catch(() => {});
}

function spawnEnemies() {
    const diff = getDifficulty();
    spawnInterval = setInterval(() => {
        enemies.push(new Enemy());
    }, diff.enemySpawnInterval);
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) particles.push(new Particle(x, y, color));
    sfxExplosion.currentTime = 0;
    sfxExplosion.volume = 0.3;
    sfxExplosion.play().catch(() => {});
}

// ========== დამეიჯის ლოგიკა (იარაღის დაქვეითებით) ==========
function takeDamage(amount) {
    if (activeEffects.shield) return;

    const diff = getDifficulty();
    health -= Math.round(amount * diff.damageMul);
    healthEl.innerText = `HP: ${Math.max(0, health)}%`;

    // იარაღის დაქვეითება (სირთულის მიხედვით)
    const levelsLost = downgradeWeapon(diff.weaponDowngrade);
    if (levelsLost > 0) {
        showPickupMessage(`WEAPON -${levelsLost}!`, "#ff2222");
    }

    if (health <= 0) endGame();
}

// ========== Power-Up ლოგიკა ==========
function tryDropPowerUp(x, y) {
    totalKills++;

    const diff = getDifficulty();

    // weapon upgrade (სირთულის მიხედვით გარანტირებული ფაზაზე)
    if (boss === null && weaponDropsRemaining > 0) {
        const timeElapsed = Date.now() - phaseStartTime;
        const timeRatio = timeElapsed / diff.bossSpawnDelay;
        const urgency = Math.max(0.12, timeRatio * 0.6);
        const dropChance = Math.min(0.7, weaponDropsRemaining * urgency * 0.08);

        if (Math.random() < dropChance) {
            weaponDropsRemaining--;
            powerUps.push(new PowerUp(x, y, "weapon_up"));
            return;
        }
    }

    // სხვა ბონუსები (სირთულის მიხედვით)
    if (Math.random() < diff.randomDropChance) {
        const roll = Math.random();
        let type;
        if (roll < 0.35) type = "health";
        else if (roll < 0.65) type = "rapid_fire";
        else if (roll < 0.85) type = "shield";
        else type = "weapon_up";
        powerUps.push(new PowerUp(x, y, type));
    }
}

function applyPowerUp(powerUp) {
    switch (powerUp.type) {
        case "weapon_up":
            if (upgradeWeapon()) {
                showPickupMessage(`${WEAPON_LEVELS[weaponLevel].name}`, WEAPON_LEVELS[weaponLevel].color);
            } else {
                const bonusPoints = Math.round(500 * getDifficulty().scoreMul);
                score += bonusPoints;
                scoreEl.innerText = `SCORE: ${score}`;
                showPickupMessage(`+${bonusPoints} BONUS`, "#ffcc00");
            }
            break;
        case "health":
            health = Math.min(100, health + 25);
            healthEl.innerText = `HP: ${health}%`;
            showPickupMessage("+25 HP", "#ff4466");
            break;
        case "rapid_fire":
            activeEffects.rapid_fire = true;
            activeEffects.rapid_fire_end = Date.now() + POWERUP_TYPES.rapid_fire.duration;
            showPickupMessage("RAPID FIRE!", "#ffdd00");
            break;
        case "shield":
            activeEffects.shield = true;
            activeEffects.shield_end = Date.now() + POWERUP_TYPES.shield.duration;
            showPickupMessage("SHIELD ON!", "#00ccff");
            break;
    }
}

function showPickupMessage(text, color) {
    pickupMessage = { text, color };
    pickupMessageTimer = 90;
}

function updateEffects() {
    const now = Date.now();
    if (activeEffects.rapid_fire && now > activeEffects.rapid_fire_end) {
        activeEffects.rapid_fire = false;
    }
    if (activeEffects.shield && now > activeEffects.shield_end) {
        activeEffects.shield = false;
    }
}

// ========== ბოსის გაფრთხილება ==========
function showBossWarning(bossName) {
    bossWarning = { name: bossName, timer: 180 };
}

function drawBossWarning() {
    if (!bossWarning || bossWarning.timer <= 0) { bossWarning = null; return; }
    bossWarning.timer--;

    const alpha = Math.min(1, bossWarning.timer / 60);
    const shake = bossWarning.timer > 120 ? (Math.random() - 0.5) * 6 : 0;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.font = "bold 28px 'Press Start 2P', cursive";
    ctx.fillStyle = "#ff0055";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#ff0055";
    ctx.fillText("⚠ WARNING ⚠", canvas.width / 2 + shake, canvas.height / 2 - 50);

    ctx.font = "bold 20px 'Press Start 2P', cursive";
    ctx.fillStyle = "#ffcc00";
    ctx.shadowColor = "#ffcc00";
    ctx.fillText(`BOSS ${currentBossIndex + 1}: ${bossWarning.name}`, canvas.width / 2, canvas.height / 2);

    ctx.restore();
}

// ========== UI ხატვა ==========
function drawWeaponUI() {
    const weapon = WEAPON_LEVELS[weaponLevel];
    const x = canvas.width / 2;
    const y = canvas.height - 30;

    ctx.save();
    ctx.font = "10px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = weapon.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = weapon.color;
    ctx.fillText(`Lv.${weaponLevel} ${weapon.name}`, x, y);

    const dotStartX = x - (MAX_WEAPON_LEVEL * 8) / 2;
    for (let i = 1; i <= MAX_WEAPON_LEVEL; i++) {
        ctx.beginPath();
        ctx.arc(dotStartX + i * 12, y + 16, 3, 0, Math.PI * 2);
        ctx.fillStyle = i <= weaponLevel ? weapon.color : "rgba(255,255,255,0.15)";
        ctx.shadowBlur = i <= weaponLevel ? 8 : 0;
        ctx.fill();
    }
    ctx.restore();
}

function drawPhaseUI() {
    const diff = getDifficulty();
    ctx.save();
    ctx.font = "9px 'Press Start 2P', cursive";
    ctx.textAlign = "right";

    // სირთულის ლეიბლი
    ctx.fillStyle = DIFFICULTY_CONFIGS[currentDifficulty].color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = DIFFICULTY_CONFIGS[currentDifficulty].color;
    ctx.fillText(DIFFICULTY_CONFIGS[currentDifficulty].label, canvas.width - 30, canvas.height - 36);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(`PHASE ${currentBossIndex + 1}/4`, canvas.width - 30, canvas.height - 20);
    ctx.restore();
}

function drawActiveEffects() {
    const now = Date.now();
    let offsetY = 0;
    ctx.save();
    ctx.font = "9px 'Press Start 2P', cursive";
    ctx.textAlign = "left";

    if (activeEffects.rapid_fire) {
        const remaining = Math.max(0, (activeEffects.rapid_fire_end - now) / 1000);
        ctx.fillStyle = "#ffdd00";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffdd00";
        ctx.fillText(`⚡ RAPID ${remaining.toFixed(1)}s`, 30, 70 + offsetY);
        offsetY += 20;
    }
    if (activeEffects.shield) {
        const remaining = Math.max(0, (activeEffects.shield_end - now) / 1000);
        ctx.fillStyle = "#00ccff";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00ccff";
        ctx.fillText(`◆ SHIELD ${remaining.toFixed(1)}s`, 30, 70 + offsetY);
    }
    ctx.restore();
}

function drawShieldEffect() {
    if (!activeEffects.shield) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, 40, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 204, 255, 0.5)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ccff";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(player.x, player.y, 38, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 204, 255, 0.08)";
    ctx.fill();
    ctx.restore();
}

function drawPickupMessage() {
    if (pickupMessageTimer <= 0 || !pickupMessage) return;
    pickupMessageTimer--;
    const alpha = Math.min(1, pickupMessageTimer / 30);
    const yOffset = (90 - pickupMessageTimer) * 0.8;

    ctx.save();
    ctx.font = "bold 16px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pickupMessage.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = pickupMessage.color;
    ctx.fillText(pickupMessage.text, player.x, player.y - 50 - yOffset);
    ctx.restore();
}

// ========== პაუზის ეკრანი ==========
function drawPauseOverlay() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // PAUSED ტექსტი
    ctx.font = "bold 36px 'Press Start 2P', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#00ffff";
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#00ffff";
    ctx.fillText("⏸ PAUSED", canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = "12px 'Press Start 2P', cursive";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 0;
    ctx.fillText("PRESS ESC TO RESUME", canvas.width / 2, canvas.height / 2 + 30);

    // სტატისტიკა პაუზის დროს
    ctx.font = "9px 'Press Start 2P', cursive";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    const diffLabel = DIFFICULTY_CONFIGS[currentDifficulty].label;
    ctx.fillText(`${diffLabel} | PHASE ${currentBossIndex + 1}/4 | Lv.${weaponLevel}`, canvas.width / 2, canvas.height / 2 + 70);

    ctx.restore();
}

// ========== მთავარი ანიმაციის ციკლი ==========
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = "rgba(5, 5, 16, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach((s) => s.update());

    if (isMenu || isGameOver) return;

    if (isPaused) {
        drawPauseOverlay();
        return;
    }

    updateEffects();

    // ========== ბოსის Spawn ლოგიკა ==========
    if (boss === null && !allBossesDefeated && currentBossIndex < 4) {
        const timeSincePhase = Date.now() - phaseStartTime;
        if (timeSincePhase >= getDifficulty().bossSpawnDelay) {
            boss = createBoss(currentBossIndex);
            clearInterval(spawnInterval);
            showBossWarning(BOSS_NAMES[currentBossIndex]);
        }
    }

    let newEnemies = [];

    // ========== ბოსის ლოგიკა ==========
    if (boss !== null) {
        boss.update();

        // ბოსთან შეჯახება
        if (
            !activeEffects.shield &&
            player.x + player.width / 2 > boss.x - boss.width / 2 &&
            player.x - player.width / 2 < boss.x + boss.width / 2 &&
            player.y + player.height / 2 > boss.y - boss.height / 2 &&
            player.y - player.height / 2 < boss.y + boss.height / 2
        ) {
            createExplosion(player.x, player.y, "#ff0055");
            health = 0;
            healthEl.innerText = `HP: 0%`;
            endGame();
        }

        // სიკვდილის ანიმაცია
        if (boss.isDying) {
            bossDefeatTimer++;
            if (bossDefeatTimer > 240) {
                createExplosion(boss.x, boss.y, "#ffcc00");
                createExplosion(boss.x - 50, boss.y + 30, "#ff4400");
                createExplosion(boss.x + 50, boss.y - 30, "#ffaa00");

                const bossScore = Math.round((2000 + (currentBossIndex * 1500)) * getDifficulty().scoreMul);
                score += bossScore;
                scoreEl.innerText = `SCORE: ${score}`;

                boss = null;
                bossProjectiles = [];
                currentBossIndex++;
                phaseStartTime = Date.now();

                if (currentBossIndex >= 4) {
                    // 🏆 გამარჯვება!
                    allBossesDefeated = true;
                    showVictory();
                } else {
                    // შემდეგი ფაზა — drop-ების განახლება
                    resetPhaseDrops();
                    spawnEnemies();
                }
            }
        }

        // ტყვიები vs ბოსი
        if (boss !== null && !boss.isDying) {
            projectiles.forEach((p) => {
                if (p.markedForDeletion) return;
                if (
                    p.y - p.radius < boss.y + boss.height / 2 &&
                    p.x + p.radius > boss.x - boss.width / 2 &&
                    p.x - p.radius < boss.x + boss.width / 2 &&
                    p.y + p.radius > boss.y - boss.height / 2
                ) {
                    boss.takeDamage(p.damage);
                    createExplosion(p.x, p.y, p.color);

                    if (boss.health <= 0 && !boss.isDying) {
                        boss.vx = 0;
                        boss.vy = 0;
                        boss.isDying = true;
                        boss.talk(boss.finalWordsText);
                        bossDefeatTimer = 0;
                    }
                    p.markedForDeletion = true;
                }
            });
        }
    }

    // ========== ბოსის ტყვიები ==========
    bossProjectiles.forEach((bp) => {
        if (bp.markedForDeletion) return;
        bp.update();

        if (bp.y > canvas.height + bp.radius || bp.y < -bp.radius ||
            bp.x < -bp.radius || bp.x > canvas.width + bp.radius) {
            bp.markedForDeletion = true;
            return;
        }

        const dist = Math.hypot(bp.x - player.x, bp.y - player.y);
        if (dist < bp.radius + 25) {
            if (activeEffects.shield) {
                createExplosion(bp.x, bp.y, "#00ccff");
                bp.markedForDeletion = true;
            } else {
                createExplosion(player.x, player.y, bp.color);
                bp.markedForDeletion = true;
                takeDamage(bp.damage); // იარაღის დაქვეითებით
            }
        }
    });

    player.update();
    drawShieldEffect();

    // ნაწილაკები
    particles = particles.filter((p) => {
        if (p.alpha <= 0) return false;
        p.update();
        return true;
    });

    // ტყვიები
    projectiles.forEach((p) => {
        if (p.markedForDeletion) return;
        p.update();
        if (p.y + p.radius < 0 || p.x < 0 || p.x > canvas.width) {
            p.markedForDeletion = true;
        }
    });

    // Power-Ups
    powerUps.forEach((pu) => {
        if (pu.markedForDeletion) return;
        pu.update();
        const dist = Math.hypot(pu.x - player.x, pu.y - player.y);
        if (dist < pu.radius + 30) {
            applyPowerUp(pu);
            pu.markedForDeletion = true;
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(pu.x, pu.y, pu.config.color));
            }
        }
    });

    // ========== მტრები ==========
    enemies.forEach((enemy) => {
        if (enemy.markedForDeletion) return;
        enemy.update();

        const distP = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distP - enemy.radius - 25 < 1) {
            if (activeEffects.shield) {
                createExplosion(enemy.x, enemy.y, "#00ccff");
                enemy.markedForDeletion = true;
                score += Math.round(5 * getDifficulty().scoreMul);
                scoreEl.innerText = `SCORE: ${score}`;
            } else {
                createExplosion(player.x, player.y, "#ff0055");
                enemy.markedForDeletion = true;
                takeDamage(15 * enemy.tier); // იარაღის დაქვეითებით
            }
        }

        if (enemy.y > canvas.height + enemy.radius) {
            enemy.markedForDeletion = true;
        }

        projectiles.forEach((p) => {
            if (p.markedForDeletion || enemy.markedForDeletion) return;
            const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (dist - enemy.radius - p.radius < 1) {
                enemy.hp -= p.damage;
                createExplosion(p.x, p.y, p.color);

                if (enemy.hp <= 0) {
                    createExplosion(enemy.x, enemy.y, "#ffcc00");
                    score += Math.round(10 * enemy.tier * getDifficulty().scoreMul);
                    scoreEl.innerText = `SCORE: ${score}`;

                    if (enemy.tier >= 3) {
                        newEnemies.push(
                            new Enemy(enemy.x - 15, enemy.y, 2),
                            new Enemy(enemy.x + 15, enemy.y, 2),
                        );
                    } else if (enemy.tier === 2) {
                        newEnemies.push(
                            new Enemy(enemy.x - 10, enemy.y, 1),
                            new Enemy(enemy.x + 10, enemy.y, 1),
                        );
                    }

                    tryDropPowerUp(enemy.x, enemy.y);
                    enemy.markedForDeletion = true;
                }
                p.markedForDeletion = true;
            }
        });
    });

    // ფილტრაცია
    projectiles = projectiles.filter((p) => !p.markedForDeletion);
    enemies = enemies.filter((e) => !e.markedForDeletion);
    bossProjectiles = bossProjectiles.filter((bp) => !bp.markedForDeletion);
    powerUps = powerUps.filter((pu) => !pu.markedForDeletion);
    if (newEnemies.length > 0) enemies.push(...newEnemies);

    // UI
    drawWeaponUI();
    drawPhaseUI();
    drawActiveEffects();
    drawPickupMessage();
    drawBossWarning();
}

// ========== თამაშის მართვა ==========
function endGame() {
    isGameOver = true;
    bgMusic.pause();
    clearInterval(spawnInterval);
    finalScoreEl.innerText = `SCORE: ${score}`;
    gameOverScreen.style.display = "flex";
}

function showVictory() {
    isGameOver = true;
    bgMusic.pause();
    clearInterval(spawnInterval);
    victoryScoreEl.innerText = `FINAL SCORE: ${score}`;
    victoryScreen.style.display = "flex";
}

function startGame() {
    isMenu = false;
    isGameOver = false;
    isPaused = false;
    score = 0;
    health = 100;
    projectiles = [];
    enemies = [];
    particles = [];
    bossProjectiles = [];
    powerUps = [];

    resetArsenal();
    gameJustStarted = true;

    boss = null;
    currentBossIndex = 0;
    allBossesDefeated = false;
    phaseStartTime = Date.now();
    bossDefeatTimer = 0;
    bossWarning = null;
    clearInterval(spawnInterval);

    pickupMessage = null;
    pickupMessageTimer = 0;

    scoreEl.innerText = `SCORE: 0`;
    healthEl.innerText = `HP: 100%`;
    gameOverScreen.style.display = "none";
    victoryScreen.style.display = "none";
    bgMusic.volume = 0.2;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});

    spawnEnemies();
}

function initApp() {
    for (let i = 0; i < 150; i++) stars.push(new Star());
    animate();
}

initApp();
