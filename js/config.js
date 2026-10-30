// ========================================
// თამაშის პარამეტრები
// ყველა რიცხვი აქ არის — შეცვალე და ნახე რა მოხდება!
// ზომები პიქსელებშია, სიჩქარე — პიქსელი/წამში, დრო — წამებში.
// ========================================

// თამაშის "ლოგიკური" ეკრანი. ბრაუზერში ის ავტომატურად იზრდება.
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

// ფერების პალიტრა — ბოსებში და კონფიგში ფერს სახელით წერ: color: "red"
export const PALETTE = {
    black: "#0b0b1a",
    night: "#161633",
    navy: "#26285e",
    slate: "#4d5288",
    gray: "#9aa0c3",
    white: "#f4f4ff",
    red: "#ff3b5c",
    orange: "#ff8a3d",
    yellow: "#ffd23f",
    lime: "#9cff57",
    green: "#2ee6a6",
    cyan: "#3fd8ff",
    blue: "#3a7bff",
    purple: "#a55cff",
    pink: "#ff5cd6",
    brown: "#8a5a44",
};

// "red" → "#ff3b5c". თუ სახელი პალიტრაში არ არის, ისე დააბრუნებს (მაგ. "#123456").
export function color(name) {
    return PALETTE[name] ?? name;
}

// ========================================
// სირთულე: student < junior < middle < senior
// ========================================
export const DIFFICULTIES = {
    student: {
        label: "STUDENT",
        color: "green",
        description: "სწავლა ახლა იწყება",
        enemySpawnInterval: 1.8, // რამდენ წამში ერთხელ ჩნდება მეტეორი
        enemySpeedMul: 0.7,
        meteorTimeMul: 1.33, // ბოსამდე მეტეორების ფაზის ხანგრძლივობა
        bossHpMul: 0.6,
        bossShootCooldownMul: 1.4, // მეტი = ბოსი ნელა ისვრის
        bossBulletSpeedMul: 0.7,
        weaponDropsPerLevel: 8,
        weaponDowngrade: 1, // დაზიანებისას რამდენი დონით ეცემა იარაღი
        damageMul: 0.6,
        randomDropChance: 0.14,
        scoreMul: 0.5,
    },
    junior: {
        label: "JUNIOR",
        color: "cyan",
        description: "პირველი ნაბიჯები",
        enemySpawnInterval: 1.5,
        enemySpeedMul: 0.85,
        meteorTimeMul: 1.17,
        bossHpMul: 0.8,
        bossShootCooldownMul: 1.2,
        bossBulletSpeedMul: 0.85,
        weaponDropsPerLevel: 6,
        weaponDowngrade: 2,
        damageMul: 0.8,
        randomDropChance: 0.1,
        scoreMul: 0.8,
    },
    middle: {
        label: "MIDDLE",
        color: "orange",
        description: "ნამდვილი გამოწვევა",
        enemySpawnInterval: 1.2,
        enemySpeedMul: 1.0,
        meteorTimeMul: 1.0,
        bossHpMul: 1.0,
        bossShootCooldownMul: 1.0,
        bossBulletSpeedMul: 1.0,
        weaponDropsPerLevel: 5,
        weaponDowngrade: 3,
        damageMul: 1.0,
        randomDropChance: 0.07,
        scoreMul: 1.0,
    },
    senior: {
        label: "SENIOR",
        color: "red",
        description: "მხოლოდ ლეგენდებისთვის",
        enemySpawnInterval: 0.9,
        enemySpeedMul: 1.3,
        meteorTimeMul: 1.0,
        bossHpMul: 1.4,
        bossShootCooldownMul: 0.7,
        bossBulletSpeedMul: 1.3,
        weaponDropsPerLevel: 3,
        weaponDowngrade: 4,
        damageMul: 1.3,
        randomDropChance: 0.04,
        scoreMul: 2.0,
    },
};

// ========================================
// მოთამაშე
// ========================================
export const PLAYER = {
    width: 44, // სპრაიტის მაქსიმალური ზომა
    height: 24,
    radius: 10, // რამდენად ახლოს უნდა მოხვდეს ტყვია
    speed: 260, // კლავიატურით მოძრაობის სიჩქარე
    maxHealth: 100,
};

// ========================================
// იარაღის დონეები (1 → 6)
// pattern — რამდენი ტყვია გადის ერთ სროლაზე და საიდან:
//   dx, dy  — ხომალდის ცენტრიდან დაშორება
//   vx      — გვერდითი სიჩქარე (დახრილი ტყვიისთვის)
//   speedMul — სიჩქარის მამრავლი
// ========================================
export const WEAPONS = [
    {
        name: "BLASTER",
        color: "green",
        radius: 2,
        speed: 290,
        damage: 1,
        cooldown: 0.22,
        pattern: [{ dx: 0, dy: -8 }],
    },
    {
        name: "DUAL BEAM",
        color: "cyan",
        radius: 2,
        speed: 310,
        damage: 1,
        cooldown: 0.2,
        pattern: [
            { dx: -8, dy: -4 },
            { dx: 8, dy: -4 },
        ],
    },
    {
        name: "HYPER SHOT",
        color: "lime",
        radius: 2.5,
        speed: 360,
        damage: 2,
        cooldown: 0.16,
        pattern: [{ dx: 0, dy: -8 }],
    },
    {
        name: "TRI-SPREAD",
        color: "orange",
        radius: 2,
        speed: 335,
        damage: 1.5,
        cooldown: 0.2,
        pattern: [
            { dx: 0, dy: -8 },
            { dx: -4, dy: -6, vx: -72, speedMul: 0.9 },
            { dx: 4, dy: -6, vx: 72, speedMul: 0.9 },
        ],
    },
    {
        name: "PLASMA DUAL",
        color: "pink",
        radius: 3.5,
        speed: 240,
        damage: 3,
        cooldown: 0.25,
        pattern: [
            { dx: -8, dy: -4 },
            { dx: 8, dy: -4 },
        ],
    },
    {
        name: "ULTIMATE",
        color: "yellow",
        radius: 2.5,
        speed: 360,
        damage: 2.8,
        cooldown: 0.15,
        pattern: [
            { dx: -8, dy: -6, vx: -144 },
            { dx: -4, dy: -6, vx: -72 },
            { dx: 0, dy: -6 },
            { dx: 4, dy: -6, vx: 72 },
            { dx: 8, dy: -6, vx: 144 },
        ],
    },
];

// ========================================
// ბონუსები (power-up), რომლებიც მეტეორებიდან ცვივა
//   weight — რამდენად ხშირად ცვივა სხვებთან შედარებით
//   icon   — 7×7 პიქსელიანი ხატულა: "X" = შეღებილი, "." = ცარიელი. დახატე შენი!
//   apply(game) — რა ხდება აღებისას. აბრუნებს ტექსტს, რომელიც ეკრანზე გამოჩნდება.
// ========================================
export const POWERUPS = {
    weapon_up: {
        color: "lime",
        icon: [
            "...X...",
            "..XXX..",
            ".XXXXX.",
            "XXXXXXX",
            "..XXX..",
            "..XXX..",
            "..XXX..",
        ],
        weight: 15,
        apply: (game) => game.upgradeWeapon(),
    },
    health: {
        color: "red",
        icon: [
            ".XX.XX.",
            "XXXXXXX",
            "XXXXXXX",
            "XXXXXXX",
            ".XXXXX.",
            "..XXX..",
            "...X...",
        ],
        weight: 35,
        apply: (game) => {
            game.heal(25);
            return "+25 HP";
        },
    },
    rapid_fire: {
        color: "yellow",
        icon: [
            "....XX.",
            "...XX..",
            "..XX...",
            ".XXXXX.",
            "...XX..",
            "..XX...",
            ".XX....",
        ],
        weight: 30,
        apply: (game) => {
            game.addEffect("rapid_fire", 8);
            return "RAPID FIRE!";
        },
    },
    shield: {
        color: "cyan",
        icon: [
            "XXXXXXX",
            "X.....X",
            "X.XXX.X",
            "X.XXX.X",
            ".X.X.X.",
            "..X.X..",
            "...X...",
        ],
        weight: 20,
        apply: (game) => {
            game.addEffect("shield", 5);
            return "SHIELD ON!";
        },
    },
};

// ========================================
// ხმები. თუ აქ ფაილს დაამატებ, თამაში მას ჩატვირთავს.
// "music" გასაღებით დამატებული ფაილი ფონად ციკლურად დაუკრავს.
// ხმები, რომლებსაც ფაილი არ აქვს, თამაში თვითონ "აწყობს" (იხ. core/audio.js).
// ========================================
export const SOUND_FILES = {
    laser: "assets/audio/laser.mp3",
};
