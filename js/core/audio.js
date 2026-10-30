// ========================================
// ხმა (Web Audio API)
// ფაილიანი ხმები config.js-ის SOUND_FILES-დან იტვირთება.
// დანარჩენს ოსცილატორით "ვაწყობთ" — ძველი არკადების მსგავსად.
// ========================================

import { SOUND_FILES } from "../config.js";

const audioCtx = new AudioContext();
const master = audioCtx.createGain();
master.connect(audioCtx.destination);

const buffers = {};
let music = null;
let muted = false;

export async function loadSounds() {
    const entries = Object.entries(SOUND_FILES);
    await Promise.all(
        entries.map(async ([name, url]) => {
            try {
                const response = await fetch(url);
                buffers[name] = await audioCtx.decodeAudioData(await response.arrayBuffer());
            } catch {
                console.warn(`ხმა ვერ ჩაიტვირთა: ${url}`);
            }
        }),
    );
}

// ბრაუზერი ხმას მხოლოდ მომხმარებლის პირველი კლიკის შემდეგ რთავს
export function unlockAudio() {
    if (audioCtx.state === "suspended") audioCtx.resume();
}

export function toggleMute() {
    muted = !muted;
    master.gain.value = muted ? 0 : 1;
    return muted;
}

export function isMuted() {
    return muted;
}

function playBuffer(name, volume, loop = false) {
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffers[name];
    source.loop = loop;
    gain.gain.value = volume;
    source.connect(gain).connect(master);
    source.start();
    return source;
}

// მარტივი "ბიპი": სიხშირე from-დან to-მდე იცვლება `duration` წამში
function beep({ type = "square", from, to, duration, volume }) {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + duration);
}

// თეთრი ხმაური — აფეთქებისთვის
function noise({ duration, volume, cutoff }) {
    const now = audioCtx.currentTime;
    const length = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
}

export const sfx = {
    laser() {
        if (buffers.laser) playBuffer("laser", 0.15);
        else beep({ from: 900, to: 200, duration: 0.1, volume: 0.05 });
    },
    hit() {
        beep({ type: "square", from: 220, to: 110, duration: 0.05, volume: 0.04 });
    },
    explosion() {
        noise({ duration: 0.35, volume: 0.25, cutoff: 2000 });
    },
    bigExplosion() {
        noise({ duration: 1.2, volume: 0.4, cutoff: 3000 });
    },
    hurt() {
        beep({ type: "sawtooth", from: 300, to: 60, duration: 0.25, volume: 0.08 });
    },
    powerUp() {
        beep({ from: 400, to: 1200, duration: 0.2, volume: 0.06 });
    },
    warning() {
        beep({ type: "square", from: 440, to: 440, duration: 0.3, volume: 0.05 });
    },
};

export function startMusic() {
    stopMusic();
    if (buffers.music) music = playBuffer("music", 0.2, true);
}

export function stopMusic() {
    music?.stop();
    music = null;
}

export function pauseAudio() {
    audioCtx.suspend();
}

export function resumeAudio() {
    audioCtx.resume();
}
