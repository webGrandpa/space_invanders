// ========================================
// სურათების ჩატვირთვა
// ========================================

const images = new Map();

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

// აბრუნებს ჩატვირთულ სურათს, ან null-ს, თუ ვერ ჩაიტვირთა
export function getImage(src) {
    return images.get(src) ?? null;
}
