import { isVibroEnabled } from "./telegram";

/**
 * Вибро при выигрышной ставке. Чаще работает на Android (Chrome);
 * в Safari на iOS у веб-страниц обычно нет доступа к вибромотору.
 */
export function vibrateBetWin() {
  if (!isVibroEnabled()) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate([32, 48, 32, 48, 40]);
  } catch {
    /* игнор — политика / неподдерживаемый паттерн */
  }
}
