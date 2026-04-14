import { publicUrl } from "../publicUrl";
import { isSoundEnabled } from "../telegram";

/** @type {AudioContext | null} */
let ctx = null;

/** @type {Map<string, Promise<AudioBuffer>>} */
const decodePromises = new Map();

function getContext() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/**
 * Вызывать синхронно из обработчика клика по ставке.
 * После resume() Safari/iOS позволяет воспроизводить звук из таймеров через Web Audio.
 */
export function primeSfxFromUserGesture() {
  const c = getContext();
  if (!c) return;
  if (c.state === "suspended") {
    void c.resume();
  }
}

function sfxMp3Url(baseFile) {
  return publicUrl(`sounds/${baseFile}.mp3`);
}

function loadBuffer(url) {
  let p = decodePromises.get(url);
  if (!p) {
    p = (async () => {
      const c = getContext();
      if (!c) throw new Error("no AudioContext");
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const raw = await res.arrayBuffer();
      return await c.decodeAudioData(raw.slice(0));
    })();
    decodePromises.set(url, p);
  }
  return p;
}

/**
 * Предзагрузка буферов после первого тапа (пока идёт анимация).
 * @param {string[]} baseFiles — имена без расширения, файлы в public/sounds/*.mp3
 */
export function preloadSfxBases(baseFiles) {
  for (const base of baseFiles) {
    void loadBuffer(sfxMp3Url(base)).catch(() => {});
  }
}

/**
 * @param {string} url — полный URL
 * @param {number} [volume=1]
 * @returns {Promise<boolean>} удалось ли воспроизвести через Web Audio
 */
export async function playSfx(url, volume = 1) {
  const c = getContext();
  if (!c) return false;
  if (c.state === "suspended") {
    await c.resume().catch(() => {});
  }
  try {
    const buffer = await loadBuffer(url);
    const gain = c.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume));
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    gain.connect(c.destination);
    src.start(0);
    return true;
  } catch {
    /* decode / fetch failed */
    return false;
  }
}

/**
 * Воспроизведение по базовому имени файла в public/sounds/*.mp3
 * @param {string} baseFile — например "stack-of-coins"
 */
export async function playSfxBase(baseFile, volume = 1) {
  if (!isSoundEnabled()) return;
  const url = sfxMp3Url(baseFile);
  const ok = await playSfx(url, volume);
  if (ok) return;
  const v = Math.max(0, Math.min(1, volume));
  try {
    const audio = new Audio(url);
    audio.volume = v;
    await audio.play();
  } catch {
    /* ignore */
  }
}
