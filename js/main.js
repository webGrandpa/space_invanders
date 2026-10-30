// ========================================
// შესვლის წერტილი: ყველაფერს ტვირთავს და თამაშს იწყებს
// ========================================

import { LEVELS } from "./levels.js";
import { Game } from "./core/game.js";
import { preloadImages } from "./core/assets.js";
import { loadSounds } from "./core/audio.js";
import { Screens } from "./ui/screens.js";
import { SHIP_IMAGE } from "./entities/player.js";
import { METEOR_IMAGE } from "./entities/enemy.js";

const canvas = document.getElementById("game");
const loading = document.getElementById("loading");

await Promise.all([
    preloadImages([SHIP_IMAGE, METEOR_IMAGE, ...LEVELS.map((level) => level.boss.config.image)]),
    loadSounds(),
    document.fonts.load("8px 'Press Start 2P'"),
    document.fonts.load("8px 'Noto Sans Georgian'", "ა"),
]);

const screens = new Screens({
    onStart: (difficulty) => game.start(difficulty),
    onMenu: () => game.returnToMenu(),
});
const game = new Game(canvas, screens);

loading.hidden = true;
screens.show("menu");
game.run();

// ?debug მისამართში — game ობიექტი ხელმისაწვდომია კონსოლიდან
if (new URLSearchParams(location.search).has("debug")) window.game = game;
