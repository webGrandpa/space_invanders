// ========================================
// ეკრანები (HTML): მენიუ, Game Over, გამარჯვება
// ========================================

import { DIFFICULTIES, color } from "../config.js";

const CRT_KEY = "space-defenders:crt";

export class Screens {
    constructor({ onStart, onRetry, onMenu }) {
        this.screens = {
            menu: document.getElementById("menu-screen"),
            gameover: document.getElementById("gameover-screen"),
            victory: document.getElementById("victory-screen"),
        };
        this.buildDifficultyButtons(onStart);

        const actions = { menu: onMenu, retry: onRetry };
        document.querySelectorAll("[data-action]").forEach((button) => {
            button.addEventListener("click", actions[button.dataset.action]);
        });

        // ←/→ ღილაკებს შორის გადაადგილება
        document.addEventListener("keydown", (e) => {
            if (e.code !== "ArrowLeft" && e.code !== "ArrowRight") return;
            const buttons = [...document.querySelectorAll(".screen:not([hidden]) button")];
            if (buttons.length === 0) return;
            const index = buttons.indexOf(document.activeElement);
            const step = e.code === "ArrowRight" ? 1 : -1;
            buttons[(index + step + buttons.length) % buttons.length].focus();
        });

        this.setCrt(readSetting(CRT_KEY) !== "off");
    }

    // ღილაკები config.js-ის DIFFICULTIES-დან იქმნება
    buildDifficultyButtons(onStart) {
        const container = document.getElementById("difficulty-selector");
        const entries = Object.entries(DIFFICULTIES);
        entries.forEach(([key, difficulty], index) => {
            const button = document.createElement("button");
            button.className = "diff-btn";
            button.style.setProperty("--accent", color(difficulty.color));
            // სირთულის "ზოლი": რამდენი უჯრაა შევსებული
            const pips = entries.map((_, i) => `<i class="${i <= index ? "on" : ""}"></i>`).join("");
            button.innerHTML = `
                <span class="diff-name">${difficulty.label}</span>
                <span class="diff-pips" aria-hidden="true">${pips}</span>
                <span class="diff-desc ka">${difficulty.description}</span>
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
        });
    }

    // data: ველები, რომლებიც ეკრანზე [data-field="..."] ელემენტებში ჩაიწერება
    show(name, data = {}) {
        this.hide();
        const screen = this.screens[name];
        screen.hidden = false;
        screen.querySelectorAll("[data-field]").forEach((el) => {
            const value = data[el.dataset.field];
            if (typeof value === "number") el.textContent = String(value).padStart(6, "0");
            else if (value !== undefined) el.textContent = value;
        });
        screen.querySelector(".new-record")?.toggleAttribute("hidden", !data.newRecord);
        screen.querySelector("button")?.focus();
    }

    hide() {
        Object.values(this.screens).forEach((screen) => (screen.hidden = true));
    }

    // CRT — ძველი ტელევიზორის ზოლები
    setCrt(enabled) {
        document.body.classList.toggle("crt", enabled);
        writeSetting(CRT_KEY, enabled ? "on" : "off");
    }

    toggleCrt() {
        this.setCrt(!document.body.classList.contains("crt"));
    }
}

function readSetting(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeSetting(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // შენახვა შეუძლებელია — პარამეტრი მხოლოდ ამ სესიაში იმოქმედებს
    }
}
