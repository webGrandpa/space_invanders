// ========================================
// სირთულის სისტემა
// student < junior < middle < senior
// ========================================

const DIFFICULTY_CONFIGS = {
    student: {
        label: "STUDENT",
        color: "#00ff88",
        description: "სწავლა ახლა იწყება",
        enemySpawnInterval: 1800,
        enemySpeedMul: 0.7,
        bossHpMul: 0.6,
        bossShootCooldownMul: 1.4,  // მაღალი = ნელი სროლა
        bossProjSpeedMul: 0.7,
        dropChanceMul: 2.0,         // მეტი ბონუსი
        weaponDropsPerPhase: 8,
        weaponDowngrade: 1,         // დამეიჯზე 1 ლეველი
        damageMul: 0.6,
        bossSpawnDelay: 120000,     // 2 წუთი
        randomDropChance: 0.14,
    },
    junior: {
        label: "JUNIOR",
        color: "#00ccff",
        description: "პირველი ნაბიჯები",
        enemySpawnInterval: 1500,
        enemySpeedMul: 0.85,
        bossHpMul: 0.8,
        bossShootCooldownMul: 1.2,
        bossProjSpeedMul: 0.85,
        dropChanceMul: 1.5,
        weaponDropsPerPhase: 6,
        weaponDowngrade: 2,
        damageMul: 0.8,
        bossSpawnDelay: 105000,     // 1:45
        randomDropChance: 0.10,
    },
    middle: {
        label: "MIDDLE",
        color: "#ffaa00",
        description: "ნამდვილი გამოწვევა",
        enemySpawnInterval: 1200,
        enemySpeedMul: 1.0,
        bossHpMul: 1.0,
        bossShootCooldownMul: 1.0,
        bossProjSpeedMul: 1.0,
        dropChanceMul: 1.0,
        weaponDropsPerPhase: 5,
        weaponDowngrade: 3,
        damageMul: 1.0,
        bossSpawnDelay: 90000,      // 1:30
        randomDropChance: 0.07,
    },
    senior: {
        label: "SENIOR",
        color: "#ff0055",
        description: "მხოლოდ ლეგენდებისთვის",
        enemySpawnInterval: 900,
        enemySpeedMul: 1.3,
        bossHpMul: 1.4,
        bossShootCooldownMul: 0.7,  // სწრაფი სროლა
        bossProjSpeedMul: 1.3,
        dropChanceMul: 0.5,
        weaponDropsPerPhase: 3,
        weaponDowngrade: 4,
        damageMul: 1.3,
        bossSpawnDelay: 90000,      // 1:30
        randomDropChance: 0.04,
    },
};

let currentDifficulty = "middle"; // default

function getDifficulty() {
    return DIFFICULTY_CONFIGS[currentDifficulty];
}

// ========================================
// პროგრესიული არსენალის სისტემა
// Power-up-ებით იზრდება დონე (1 → 6)
// ========================================

const WEAPON_LEVELS = {
    1: {
        name: "BLASTER",
        color: "#00ffaa",
        radius: 4,
        speed: 12,
        damage: 1,
        cooldown: 220,
        type: "single",
    },
    2: {
        name: "DUAL BEAM",
        color: "#00ccff",
        radius: 3.5,
        speed: 13,
        damage: 1,
        cooldown: 200,
        type: "dual",
    },
    3: {
        name: "HYPER SHOT",
        color: "#44ffaa",
        radius: 5,
        speed: 15,
        damage: 2,
        cooldown: 160,
        type: "single",
    },
    4: {
        name: "TRI-SPREAD",
        color: "#ffaa00",
        radius: 4,
        speed: 14,
        damage: 1.5,
        cooldown: 200,
        type: "spread",
    },
    5: {
        name: "PLASMA DUAL",
        color: "#ff00ff",
        radius: 8,
        speed: 10,
        damage: 3,
        cooldown: 250,
        type: "dual",
    },
    6: {
        name: "☆ ULTIMATE ☆",
        color: "#ffcc00",
        radius: 6,
        speed: 15,
        damage: 2.8,
        cooldown: 150,
        type: "ultimate",
    },
};

const MAX_WEAPON_LEVEL = 6;

let weaponLevel = 1;
let lastFiredTime = 0;

// ========================================
// Power-Up ტიპები
// ========================================

const POWERUP_TYPES = {
    weapon_up: {
        name: "WEAPON ↑",
        color: "#00ff88",
        glowColor: "rgba(0, 255, 136, 0.4)",
        symbol: "▲",
        duration: 0,
    },
    health: {
        name: "+25 HP",
        color: "#ff4466",
        glowColor: "rgba(255, 68, 102, 0.4)",
        symbol: "♥",
        duration: 0,
    },
    rapid_fire: {
        name: "RAPID FIRE",
        color: "#ffdd00",
        glowColor: "rgba(255, 221, 0, 0.4)",
        symbol: "⚡",
        duration: 8000,
    },
    shield: {
        name: "SHIELD",
        color: "#00ccff",
        glowColor: "rgba(0, 204, 255, 0.4)",
        symbol: "◆",
        duration: 5000,
    },
};

let activeEffects = {
    rapid_fire: false,
    rapid_fire_end: 0,
    shield: false,
    shield_end: 0,
};

let weaponDropsRemaining = 5;
let totalKills = 0;

function getCurrentWeapon() {
    const base = WEAPON_LEVELS[weaponLevel];
    if (activeEffects.rapid_fire) {
        return { ...base, cooldown: Math.floor(base.cooldown * 0.5) };
    }
    return base;
}

function upgradeWeapon() {
    if (weaponLevel < MAX_WEAPON_LEVEL) {
        weaponLevel++;
        return true;
    }
    return false;
}

function downgradeWeapon(levels) {
    const oldLevel = weaponLevel;
    weaponLevel = Math.max(1, weaponLevel - levels);
    return oldLevel - weaponLevel;
}

function resetArsenal() {
    weaponLevel = 1;
    lastFiredTime = 0;
    const diff = getDifficulty();
    weaponDropsRemaining = diff.weaponDropsPerPhase;
    totalKills = 0;
    activeEffects = {
        rapid_fire: false,
        rapid_fire_end: 0,
        shield: false,
        shield_end: 0,
    };
}

function resetPhaseDrops() {
    const diff = getDifficulty();
    weaponDropsRemaining = diff.weaponDropsPerPhase;
}
