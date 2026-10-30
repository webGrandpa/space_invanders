// ========================================
// ბოსი 2 — BeKa
// 4 შეტევა: ორმაგი დამიზნება, Firewall (საკუთარი შეტევა), EMP წრე, კოდის ბურსტი
// ========================================
import { Boss } from "./Boss.js";

export class Beka extends Boss {
    static config = {
        name: "BeKa",
        image: "assets/bosses/beka.png",
        width: 84,
        height: 115,
        hp: 700,
        speed: 84,
        shootCooldown: 1.33,
        talkLines: [
            "ჩამჭრელი კითხვები გინდა?",
            "ფუნდამენტებიც არ იცი!",
            "დივებით წერე!",
            "AI ჩაგანაცვლებს!",
        ],
        finalWords: "მოდულის ბოლოს მე გავიცინებ!",
    };

    attacks = [
        () => {
            this.fireAimed({ speed: 132, radius: 3, color: "green", damage: 12 });
            this.after(0.2, () => this.fireAimed({ speed: 132, radius: 3, color: "green", damage: 12 }));
        },
        () => this.firewall(),
        () => this.fireCircle({ count: 8, speed: 84, radius: 3, color: "green", damage: 10 }),
        () =>
            this.burst({ count: 5, delay: 0.13 }, () =>
                this.fireAimed({ speed: 144, radius: 2, color: "lime", damage: 8 }),
            ),
    ];

    // საკუთარი შეტევა: ტყვიების ჰორიზონტალური კედელი.
    // აქ `shoot()`-ს ვიყენებთ — ის ნებისმიერ ადგილას და მიმართულებით ისვრის.
    firewall() {
        const count = 7;
        const wallWidth = this.width * 1.2;
        for (let i = 0; i < count; i++) {
            this.shoot({
                x: this.x - wallWidth / 2 + (wallWidth / (count - 1)) * i,
                y: this.bottom,
                vy: 96,
                radius: 2.5,
                color: "green",
                damage: 10,
            });
        }
    }
}
