/**
 * URL для файла из каталога public (учитывает `base` в vite.config, в т.ч. GitHub Pages).
 * @param {string} path — например "coin-fly.png" или "/sounds/x.ogg"
 */
export function publicUrl(path) {
  const p = path.replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${p}`;
}
