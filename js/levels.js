// ========================================
// ლეველები ★ აქ ამატებ ახალ ლეველს ★
//
// თითოეული ლეველი: ჯერ მეტეორები მოდის `meteorTime` წამი, მერე — ბოსი.
// ბოსის მოკვლის შემდეგ შემდეგი ლეველი იწყება. ბოლო ბოსის მერე — გამარჯვება.
//
// პარამეტრები:
//   boss           — ბოსის კლასი (სავალდებულო)
//   meteorTime     — რამდენი წამი გრძელდება მეტეორების ფაზა (ნაგულისხმევად 90)
//   enemySpeedMul  — მეტეორების სიჩქარის მამრავლი (ნაგულისხმევად 1)
//   spawnRateMul   — მეტეორები რამდენჯერ უფრო ხშირად ჩნდება (ნაგულისხმევად 1)
//
// სირთულე (student/senior...) ამ რიცხვებს თავის მამრავლებს ადებს.
// ========================================

import { Makhare } from "./bosses/makhare.js";
import { Beka } from "./bosses/beka.js";
import { Lasha } from "./bosses/lasha.js";
import { Nukri } from "./bosses/nukri.js";

export const LEVELS = [
    { boss: Makhare },
    { boss: Beka },
    { boss: Lasha },
    { boss: Nukri },
];

export const LEVEL_DEFAULTS = {
    meteorTime: 90,
    enemySpeedMul: 1,
    spawnRateMul: 1,
};
