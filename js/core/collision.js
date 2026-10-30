// ========================================
// შეჯახების შემოწმება
// წრე: { x, y, radius }
// მართკუთხედი: { x, y, width, height } — x, y მისი ცენტრია
// ========================================

export function circlesOverlap(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
}

export function circleRectOverlap(circle, rect) {
    // მართკუთხედის ყველაზე ახლო წერტილი წრის ცენტრთან
    const nearestX = clamp(circle.x, rect.x - rect.width / 2, rect.x + rect.width / 2);
    const nearestY = clamp(circle.y, rect.y - rect.height / 2, rect.y + rect.height / 2);
    return Math.hypot(circle.x - nearestX, circle.y - nearestY) < circle.radius;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function random(min, max) {
    return min + Math.random() * (max - min);
}
