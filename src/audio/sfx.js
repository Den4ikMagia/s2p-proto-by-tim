import { publicUrl } from "../publicUrl";

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

function pickExtension() {
  const a = document.createElement("audio");
  if (a.canPlayType('audio/mp4; codecs="mp4a.40.2"') || a.canPlayType("audio/aac")) {
    return "m4a";
  }
  if (a.canPlayType('audio/ogg; codecs="vorbis"')) {
    return "ogg";
  }
  return "m4a";
}

/**
 * @param {string} baseFile — имя без расширения, например "stack-of-coins"
 */
export function sfxUrl(baseFile) {
  return publicUrl(`sounds/${baseFile}.${pickExtension()}`);
}

function extensionFallbackOrder() {
  return pickExtension() === "m4a" ? ["m4a", "ogg"] : ["ogg", "m4a"];
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
 * @param {string[]} baseFiles
 */
export function preloadSfxBases(baseFiles) {
  for (const base of baseFiles) {
    for (const ext of extensionFallbackOrder()) {
      void loadBuffer(publicUrl(`sounds/${base}.${ext}`)).catch(() => {});
    }
  }
}

/**
 * @param {string} url — полный URL (sfxUrl / publicUrl)
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
 * Воспроизведение по базовому имени файла в public/sounds (пробует .m4a и .ogg).
 * @param {string} baseFile — например "stack-of-coins"
 */
export async function playSfxBase(baseFile, volume = 1) {
  for (const ext of extensionFallbackOrder()) {
    const url = publicUrl(`sounds/${baseFile}.${ext}`);
    // eslint-disable-next-line no-await-in-loop
    const ok = await playSfx(url, volume);
    if (ok) return;
  }
  const v = Math.max(0, Math.min(1, volume));
  for (const ext of ["m4a", "ogg"]) {
    const url = publicUrl(`sounds/${baseFile}.${ext}`);
    try {
      const audio = new Audio(url);
      audio.volume = v;
      // eslint-disable-next-line no-await-in-loop
      await audio.play();
      return;
    } catch {
      /* next */
    }
  }
}
