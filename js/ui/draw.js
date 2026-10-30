// ========================================
// ხატვის დამხმარეები: ტექსტი, პიქსელური ჩარჩო, ხატულა
// ========================================

import { color } from "../config.js";

export const FONT = "'Press Start 2P', 'Noto Sans Georgian'";
const GEORGIAN = /[\u10A0-\u10FF]/;

// Press Start 2P-ს ქართული ასოები არ აქვს. ქართული ტექსტი Noto Sans Georgian-ით
// იხატება და ცოტა უფრო დიდი, რომ პიქსელურ შრიფტს თანაბრად გვერდით დაუდგეს.
export function fontFor(value, size = 8) {
    return GEORGIAN.test(value) ? `bold ${Math.round(size * 1.3)}px 'Noto Sans Georgian'` : `${size}px ${FONT}`;
}

export function drawText(
    ctx,
    value,
    x,
    y,
    { size = 8, fill = "white", align = "left", baseline = "top", shadow = null } = {},
) {
    ctx.font = fontFor(String(value), size);
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    // პიქსელური "მყარი" ჩრდილი, ბუნდოვანი glow-ს მაგივრად
    if (shadow) {
        ctx.fillStyle = color(shadow);
        ctx.fillText(value, Math.round(x) + 1, Math.round(y) + 1);
    }
    ctx.fillStyle = color(fill);
    ctx.fillText(value, Math.round(x), Math.round(y));
}

// მართკუთხედი "მოჭრილი" კუთხეებით — კლასიკური პიქსელური ჩარჩო
export function drawPixelFrame(ctx, x, y, width, height, { fill = "black", border = "white" } = {}) {
    x = Math.round(x);
    y = Math.round(y);
    ctx.fillStyle = color(border);
    ctx.fillRect(x + 1, y, width - 2, height);
    ctx.fillRect(x, y + 1, width, height - 2);
    ctx.fillStyle = color(fill);
    ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
}

// ხატულა სტრიქონების მასივიდან: "X" = შეღებილი პიქსელი, "." = ცარიელი
export function drawIcon(ctx, icon, x, y, fill, pixelSize = 1) {
    ctx.fillStyle = color(fill);
    icon.forEach((row, rowIndex) => {
        [...row].forEach((cell, colIndex) => {
            if (cell === "X") {
                ctx.fillRect(
                    Math.round(x) + colIndex * pixelSize,
                    Math.round(y) + rowIndex * pixelSize,
                    pixelSize,
                    pixelSize,
                );
            }
        });
    });
}

// ტექსტს ხაზებად ყოფს ისე, რომ თითოეული maxWidth-ზე განიერი არ იყოს
export function wrapText(ctx, value, maxWidth) {
    const lines = [];
    let line = "";
    for (const word of value.split(" ")) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(candidate).width > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines;
}
