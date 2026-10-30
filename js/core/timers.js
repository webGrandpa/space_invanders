// ========================================
// თამაშის ტაიმერები
// setTimeout/setInterval-ის მაგივრად: ეს ტაიმერები თამაშის საათს მიჰყვება,
// ამიტომ პაუზაზე ჩერდება და რესტარტზე ქრება.
// ========================================

export class Timers {
    constructor() {
        this.time = 0;
        this.list = [];
    }

    // fn გაეშვება `seconds` წამის შემდეგ
    after(seconds, fn) {
        const timer = { at: this.time + seconds, fn, cancelled: false };
        this.list.push(timer);
        return timer;
    }

    // fn გაეშვება ყოველ `seconds` წამში
    every(seconds, fn) {
        const timer = { at: this.time + seconds, interval: seconds, fn, cancelled: false };
        this.list.push(timer);
        return timer;
    }

    cancel(timer) {
        if (timer) timer.cancelled = true;
    }

    clear() {
        this.list = [];
    }

    update(dt) {
        this.time += dt;
        // ასლზე ვიმეორებთ, რადგან fn-მა შეიძლება ახალი ტაიმერი დაამატოს
        for (const timer of [...this.list]) {
            if (timer.cancelled || timer.at > this.time) continue;
            timer.fn();
            if (timer.interval) timer.at += timer.interval;
            else timer.cancelled = true;
        }
        this.list = this.list.filter((t) => !t.cancelled);
    }
}
