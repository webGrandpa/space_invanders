// ========================================
// ბოსი 4 — Nukri (ფინალური ბოსი)
// 5 შეტევა. როცა სიცოცხლე 50%-ზე ჩამოდის, "ბრაზდება":
// უფრო სწრაფად მოძრაობს, ხშირად ისვრის და მეტ ტყვიას უშვებს.
// ========================================
import { Boss } from "./Boss.js";

export class Nukri extends Boss {
    static config = {
        name: "Nukri",
        image: "assets/bosses/nukri.png",
        width: 84,
        height: 115,
        hp: 1500,
        speed: 60,
        shootCooldown: 1.17,
        talkInterval: 8.3,
        talkLines: ["საღამოს გავქოლოთ!", "Red flag!", "აჯენდაააააააა!", "სპიდრანიიი!"],
        finalWords: "ეგ ჩემთვის რედფლეგია!...",
    };

    enraged = false;

    constructor(game) {
        super(game);
        this.onHealthBelow(0.5, () => this.enrage());
    }

    enrage() {
        this.enraged = true;
        this.shootCooldown *= 0.57;
        this.speed = 96;
        this.say("!! ENRAGED !!");
    }

    // ბრაზისას ტყვიები 30%-ით სწრაფია
    get bulletSpeed() {
        return this.enraged ? 1.3 : 1;
    }

    attacks = [
        () =>
            this.fireSpread({
                count: this.enraged ? 7 : 5,
                speed: 96 * this.bulletSpeed,
                radius: 3,
                color: "yellow",
                damage: 15,
            }),
        () => {
            const aimed = () =>
                this.fireAimed({ speed: 120 * this.bulletSpeed, radius: 3.5, color: "orange", damage: 15 });
            aimed();
            this.after(0.15, aimed);
            this.after(0.3, aimed);
        },
        () =>
            this.fireCircle({
                count: this.enraged ? 16 : 12,
                speed: 72 * this.bulletSpeed,
                radius: 2.5,
                color: "orange",
                damage: 12,
            }),
        () => this.fireCircle({ count: 8, speed: 96 * this.bulletSpeed, radius: 2.5, color: "white", damage: 12 }),
        () =>
            this.burst(
                { count: this.enraged ? 8 : 5, delay: this.enraged ? 0.08 : 0.12 },
                () => {
                    if (Math.random() < 0.5) {
                        this.fireAimed({ speed: 132, radius: 2.5, color: "yellow", damage: 12 });
                    } else {
                        this.fireDown({ spreadX: 24, speed: 120, radius: 3, color: "orange", damage: 12 });
                    }
                },
            ),
    ];

    // drawBody-ს ვაფართოებთ: ჯერ ნარინჯისფერი აურა, მერე ჩვეულებრივი სურათი
    drawBody(ctx) {
        if (this.enraged) {
            ctx.fillStyle = "rgba(255, 138, 61, 0.15)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.75, 0, Math.PI * 2);
            ctx.fill();
        }
        super.drawBody(ctx);
    }
}
