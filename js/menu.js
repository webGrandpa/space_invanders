const startScreen = document.getElementById("start-screen");
const diffButtons = document.querySelectorAll(".diff-btn");

function initMenu() {
    diffButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isMenu) return;

            // სირთულის დაყენება
            const difficulty = btn.dataset.difficulty;
            currentDifficulty = difficulty;

            // ვიზუალური არჩევანის ეფექტი
            btn.classList.add("diff-btn-selected");

            // მცირე დაყოვნება ეფექტისთვის
            setTimeout(() => {
                startScreen.style.display = "none";
                startGame();
            }, 300);
        });

        // Hover ეფექტის ფერი
        btn.addEventListener("mouseenter", () => {
            const diff = btn.dataset.difficulty;
            const color = DIFFICULTY_CONFIGS[diff].color;
            btn.style.borderColor = color;
            btn.style.boxShadow = `0 0 20px ${color}44, inset 0 0 15px ${color}22`;
        });

        btn.addEventListener("mouseleave", () => {
            if (!btn.classList.contains("diff-btn-selected")) {
                btn.style.borderColor = "";
                btn.style.boxShadow = "";
            }
        });
    });
}

window.onload = initMenu;
