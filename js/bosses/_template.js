// ========================================
// ბოსის ნიმუში — დააკოპირე ეს ფაილი და შექმენი შენი ბოსი!
//
// ნაბიჯები (დაწვრილებით: CONTRIBUTING.md):
//   1. დააკოპირე ფაილი: js/bosses/_template.js → js/bosses/mybossname.js
//   2. გადაარქვი კლასს სახელი: TemplateBoss → MyBossName
//   3. ჩადე სურათი assets/bosses/ საქაღალდეში (PNG გამჭვირვალე ფონით)
//   4. js/levels.js-ში დაამატე: import + { boss: MyBossName }
//   5. გაუშვი http://localhost:8080/?debug და დააჭირე ბოსის ნომერს (1-9)
// ========================================

import { Boss } from "./Boss.js";

export class TemplateBoss extends Boss {
    // ===== პარამეტრები =====
    // ზომები პიქსელებშია (თამაშის ეკრანი 640×360-ია), სიჩქარე — პიქსელი/წამში.
    static config = {
        name: "Template",
        image: "assets/bosses/template.png", // თუ ფაილი არ არსებობს, ფერადი მართკუთხედი დაიხატება
        color: "purple", // მართკუთხედის ფერი, როცა სურათი არ არის
        width: 100,
        height: 100,
        hp: 500, // სირთულე ამას თავის მამრავლს ადებს
        speed: 70, // რამდენად სწრაფად დადის მარცხნივ-მარჯვნივ
        shootCooldown: 1.5, // რამდენ წამში ერთხელ ესვრის
        talkInterval: 10, // რამდენ წამში ერთხელ ამბობს რამეს
        talkLines: ["ჩემი პირველი ბოსი!", "console.log('hi')"],
        finalWords: "ბაგი იპოვე...",
    };

    // ===== შეტევები =====
    // ბოსი ამ სიას რიგრიგობით ასრულებს: 1-ლი, მე-2, მე-3, ისევ 1-ლი...
    // ფერებად შეგიძლია PALETTE-ის სახელები გამოიყენო (js/config.js):
    // red, orange, yellow, lime, green, cyan, blue, purple, pink, white
    attacks = [
        // 1. სამი ტყვია მარაოსავით ქვემოთ
        () => this.fireSpread({ count: 3, speed: 100, radius: 3, color: "red", damage: 10 }),

        // 2. ერთი ტყვია პირდაპირ მოთამაშისკენ
        () => this.fireAimed({ speed: 130, radius: 3, color: "yellow", damage: 12 }),

        // 3. 8 ტყვია წრეზე ყველა მიმართულებით
        () => this.fireCircle({ count: 8, speed: 80, radius: 2.5, color: "cyan", damage: 8 }),

        // 4. "ბურსტი": 5-ჯერ, 0.15 წამის ინტერვალით, ტყვია ქვემოთ
        () =>
            this.burst({ count: 5, delay: 0.15 }, () =>
                this.fireDown({ spreadX: 20, speed: 120, radius: 2, color: "orange", damage: 8 }),
            ),

        // 5. ორი ტყვია ერთმანეთის მიყოლებით — after() = setTimeout, ოღონდ პაუზას ემორჩილება
        () => {
            this.fireAimed({ speed: 150, radius: 2, color: "pink", damage: 10 });
            this.after(0.3, () => this.fireAimed({ speed: 150, radius: 2, color: "pink", damage: 10 }));
        },

        // 6. პატარა მეტეორების გამოძახება
        () => this.summonMinions({ count: 2 }),

        // 7. საკუთარი შეტევა — იხ. ქვემოთ
        () => this.zigzag(),
    ];

    // ===== constructor: ერთჯერადი მოვლენები =====
    constructor(game) {
        super(game); // აუცილებელია! Boss-ის constructor-ს იძახებს

        // როცა სიცოცხლე 50%-ზე ჩამოვა — ერთხელ გაეშვება
        this.onHealthBelow(0.5, () => {
            this.say("ახლა სერიოზულად!");
            this.speed *= 1.5;
            this.shootCooldown *= 0.7;
        });
    }

    // ===== საკუთარი შეტევა =====
    // shoot() ყველაზე "დაბალი დონის" დამხმარეა: ტყვია ნებისმიერ ადგილას და მიმართულებით.
    // vx — გვერდითი სიჩქარე, vy — ვერტიკალური (დადებითი = ქვემოთ)
    zigzag() {
        for (let i = 0; i < 5; i++) {
            this.shoot({
                x: this.x - 40 + i * 20,
                y: this.bottom,
                vx: i % 2 === 0 ? 40 : -40,
                vy: 100,
                radius: 2.5,
                color: "lime",
                damage: 8,
            });
        }
    }

    // ===== update: ყოველ კადრში (არასავალდებულო) =====
    // dt — წინა კადრიდან გასული დრო წამებში
    update(dt) {
        // მაგალითად, ბოსი შეიძლება დროდადრო ტელეპორტირდეს:
        // if (Math.random() < 0.1 * dt) this.teleport();
        super.update(dt); // აუცილებელია! მოძრაობა, სროლა და ლაპარაკი აქ ხდება
    }

    // ===== drawBody: გარეგნობა (არასავალდებულო) =====
    // თუ სურათის მაგივრად საკუთარი ფიგურის დახატვა გინდა:
    // drawBody(ctx) {
    //     ctx.fillStyle = "#ff3b5c";
    //     ctx.fillRect(this.x - this.width / 2, this.top, this.width, this.height);
    // }
}
