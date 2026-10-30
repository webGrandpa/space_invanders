// ========================================
// სურათების ჩატვირთვა და "დაპიქსელება"
// ========================================

const images = new Map();
const sprites = new Map();
const trimCache = new Map();

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            images.set(src, img);
            resolve();
        };
        img.onerror = () => {
            console.warn(`სურათი ვერ ჩაიტვირთა: ${src}`);
            resolve();
        };
        img.src = src;
    });
}

// ყველა სურათს ერთად ტვირთავს. თამაში მხოლოდ ამის შემდეგ იწყება.
export function preloadImages(sources) {
    return Promise.all([...new Set(sources)].map(loadImage));
}

// აბრუნებს სურათს პიქსელ-არტად გადაკეთებულს:
//   - გამჭვირვალე კიდეები მოჭრილია
//   - დაპატარავებულია ისე, რომ maxWidth × maxHeight-ში ჩაეტიოს
//   - ნახევრად გამჭვირვალე პიქსელები ან სრულად ჩანს, ან სრულად ქრება
//   - tint: თუ მითითებულია, მთელი სილუეტი ამ ფერით იღებება (მოხვედრის "ციმციმი")
// თუ სურათი ვერ ჩაიტვირთა, აბრუნებს null-ს.
export function getSprite(src, maxWidth, maxHeight, tint = null) {
    const key = `${src}|${maxWidth}|${maxHeight}|${tint}`;
    if (sprites.has(key)) return sprites.get(key);

    const img = images.get(src);
    if (!img) return null;

    const bounds = getTrimBounds(src, img);
    const scale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bounds.width * scale));
    canvas.height = Math.max(1, Math.round(bounds.height * scale));

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, canvas.width, canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < pixels.data.length; i += 4) {
        pixels.data[i] = pixels.data[i] < 110 ? 0 : 255;
    }
    ctx.putImageData(pixels, 0, 0);

    if (tint) {
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    sprites.set(key, canvas);
    return canvas;
}

// სურათის ის ნაწილი, სადაც რამე ჩანს (გამჭვირვალე კიდეების გარეშე)
function getTrimBounds(src, img) {
    if (trimCache.has(src)) return trimCache.get(src);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > 20) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    const bounds =
        maxX < 0
            ? { x: 0, y: 0, width, height }
            : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    trimCache.set(src, bounds);
    return bounds;
}

// სპრაიტს ხატავს ცენტრით (x, y) წერტილში
export function drawSprite(ctx, sprite, x, y) {
    ctx.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height / 2));
}
