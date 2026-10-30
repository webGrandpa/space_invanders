// ========================================
// ეკრანები (HTML): მენიუ, Game Over, გამარჯვება
// ========================================

import { DIFFICULTIES, color } from "../config.js";

export class Screens {
    constructor({ onStart, onMenu }) {
        this.screens = {
            menu: document.getElementById("menu-screen"),
            gameover: document.getElementById("gameover-screen"),
            victory: document.getElementById("victory-screen"),
        };
        this.buildDifficultyButtons(onStart);

        document.querySelectorAll("[data-action='menu']").forEach((button) => {
            button.addEventListener("click", onMenu);
        });
    }

    // ღილაკები config.js-ის DIFFICULTIES-დან იქმნება
    buildDifficultyButtons(onStart) {
        const container = document.getElementById("difficulty-selector");
        for (const [key, difficulty] of Object.entries(DIFFICULTIES)) {
            const button = document.createElement("button");
            button.className = "diff-btn";
            button.style.setProperty("--accent", color(difficulty.color));
            button.innerHTML = `
                <span class="diff-name">${difficulty.label}</span>
                <span class="diff-desc">${difficulty.description}</span>
            `;
            button.addEventListener("click", () => {
                button.classList.add("selected");
                // მცირე პაუზა, რომ არჩევის ანიმაცია გამოჩნდეს
                setTimeout(() => {
                    button.classList.remove("selected");
                    onStart(key);
                }, 300);
            });
            container.append(button);
        }
    }

    show(name, { score } = {}) {
        this.hide();
        const screen = this.screens[name];
        screen.hidden = false;
        screen.querySelectorAll("[data-score]").forEach((el) => (el.textContent = score));
        screen.querySelector("button")?.focus();
    }

    hide() {
        Object.values(this.screens).forEach((screen) => (screen.hidden = true));
    }
}
