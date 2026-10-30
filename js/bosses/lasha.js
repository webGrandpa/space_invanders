// ========================================
// ბოსი 3 — Lasha
// 4 შეტევა: სპირალი, ფართო მარაო, მინიონები, წვიმა
// განსაკუთრებული: დროდადრო ტელეპორტირდება
// ========================================
import { Boss } from "./Boss.js";
import { random } from "../core/collision.js";

export class Lasha extends Boss {
    static config = {
        name: "Lasha",
        image: "assets/bosses/lasha.png",
        width: 110,
        height: 115,
        hp: 1100,
        speed: 72,
        shootCooldown: 1.08,
        talkInterval: 8.3,
        talkLines: [
            "არ უნდა ამას ამდენი შაში-ბეში",
            "ეე ძმაო ეგრე არაა...",
            "კარელოოოო!",
            "დავალებებს რატო არ წერ?",
        ],
        finalWords: "მაცადე გამოცდა მოვიდეს!...",
    };

    spiralAngle = 0;
    teleportTimer = 0;
    nextTeleport = random(6.5, 9);

    attacks = [
        () => {
            this.spiralAngle += 0.5;
            this.fireCircle({
                count: 4,
                speed: 84,
                offset: this.spiralAngle,
                radius: 2.5,
                color: "pink",
                damage: 12,
            });
        },
        () => this.fireSpread({ count: 5, speed: 84, radius: 2.5, color: "red", damage: 10 }),
        () => this.summonMinions({ count: 2 }),
        () =>
            this.burst({ count: 6, delay: 0.1 }, () =>
                this.fireDown({ spreadX: 20, speed: 120, radius: 2, color: "pink", damage: 10 }),
            ),
    ];

    // update-ს ვაფართოებთ: ჯერ ჩვენი ლოგიკა, მერე ჩვეულებრივი (super.update)
    update(dt) {
        if (!this.isDying && this.enteredScreen) {
            this.teleportTimer += dt;
            if (this.teleportTimer > this.nextTeleport) {
                this.teleport();
                this.teleportTimer = 0;
                this.nextTeleport = random(6.5, 9);
            }
        }
        super.update(dt);
    }
}
