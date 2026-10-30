// ========================================
// მართვა: მაუსი, შეხება (ტელეფონი) და კლავიატურა
// ========================================

import { GAME_WIDTH } from "../config.js";

// ამ ღილაკებზე ბრაუზერის ჩვეულ ქცევას ვთიშავთ (მაგ. Space გვერდს არ ჩამოსქროლავს)
const GAME_KEYS = ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = new Set();
        this.pointerX = null; // მაჩვენებლის X თამაშის კოორდინატებში
        this.pointerDown = false;
        this.usingPointer = false;
        this.keyListeners = [];

        window.addEventListener("pointermove", (e) => this.updatePointer(e));
        window.addEventListener("pointerdown", (e) => {
            if (e.target.closest("button")) return;
            this.updatePointer(e);
            this.pointerDown = true;
        });
        window.addEventListener("pointerup", () => (this.pointerDown = false));
        window.addEventListener("pointercancel", () => (this.pointerDown = false));

        window.addEventListener("keydown", (e) => {
            if (GAME_KEYS.includes(e.code)) e.preventDefault();
            this.keys.add(e.code);
            if (!e.repeat) this.keyListeners.forEach((fn) => fn(e.code));
        });
        window.addEventListener("keyup", (e) => this.keys.delete(e.code));

        // ფანჯრიდან გასვლისას ღილაკები "არ უნდა გაიჭედოს"
        window.addEventListener("blur", () => {
            this.keys.clear();
            this.pointerDown = false;
        });
    }

    updatePointer(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = ((e.clientX - rect.left) / rect.width) * GAME_WIDTH;
        this.usingPointer = true;
    }

    // ერთჯერადი დაჭერისთვის (Esc, M, ...)
    onKeyPress(fn) {
        this.keyListeners.push(fn);
    }

    isDown(...codes) {
        return codes.some((code) => this.keys.has(code));
    }

    // -1 = მარცხნივ, 1 = მარჯვნივ, 0 = ადგილზე
    get moveDirection() {
        let direction = 0;
        if (this.isDown("ArrowLeft", "KeyA")) direction -= 1;
        if (this.isDown("ArrowRight", "KeyD")) direction += 1;
        if (direction !== 0) this.usingPointer = false;
        return direction;
    }

    get firing() {
        return this.pointerDown || this.isDown("Space");
    }
}
