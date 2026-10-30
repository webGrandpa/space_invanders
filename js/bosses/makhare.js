// ========================================
// ბოსი 1 — Makhare
// 3 შეტევა: მარაო, დამიზნებული ტყვია, ტყვიების წვიმა
// ========================================
import { Boss } from "./Boss.js";

export class Makhare extends Boss {
    static config = {
        name: "Makhare",
        image: "assets/bosses/makhare.png",
        width: 112,
        height: 112,
        hp: 400,
        speed: 60,
        shootCooldown: 1.65,
        talkLines: ["კოდის წერა ისწავლე", "F ნიშანი გაქვს!", "ეს კოდი არ კომპილირდება"],
        finalWords: "გამოცდაში მაინც ჩაგჭრი!!!...",
    };

    attacks = [
        () => this.fireSpread({ count: 3, speed: 96, radius: 3, color: "red", damage: 10 }),
        () => this.fireAimed({ speed: 120, radius: 4, color: "purple", damage: 12 }),
        () =>
            this.burst({ count: 4, delay: 0.13 }, () =>
                this.fireDown({ spreadX: 12, speed: 108, radius: 2.5, color: "orange", damage: 8 }),
            ),
    ];
}
