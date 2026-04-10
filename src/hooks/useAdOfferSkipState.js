import { useEffect, useRef, useState } from "react";
import { useOffers } from "../context/OffersContext";

/**
 * Таймер skip для рекламного слайда: тикает только пока слайд в центре ленты.
 * Сброс счётчика — только после ухода со слайда (в т.ч. после успешного скролла по «×»).
 *
 * @param {string} feedItemKey — как в ленте: `${type}:${id}`
 * @param {number} skipSeconds
 * @param {boolean} [paused] — true: пропускной плейсмент без таймера/skip
 */
export function useAdOfferSkipState(feedItemKey, skipSeconds = 15, paused = false) {
  const { activeFeedItemKey } = useOffers();
  const [secondsLeft, setSecondsLeft] = useState(skipSeconds);
  const [canSkip, setCanSkip] = useState(false);
  const wasActiveRef = useRef(false);

  const isActive = activeFeedItemKey === feedItemKey;

  useEffect(() => {
    if (paused || !isActive) return;
    if (secondsLeft <= 0) {
      setCanSkip(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, isActive, paused]);

  useEffect(() => {
    if (paused) return;
    if (wasActiveRef.current && !isActive) {
      setSecondsLeft(skipSeconds);
      setCanSkip(false);
    }
    wasActiveRef.current = isActive;
  }, [isActive, skipSeconds, paused]);

  return { secondsLeft, canSkip };
}
