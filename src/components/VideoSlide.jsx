import { useEffect, useMemo, useState } from "react";
import { primeSfxFromUserGesture, preloadSfxBases } from "../audio/sfx";
import { vibrateBetWin } from "../haptics";
import { useOffers } from "../context/OffersContext";
import "./VideoSlide.css";

function winningIsLowFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2 === 0;
}

/**
 * @param {{ id: string, src: string, isActive: boolean }} props
 */
export function VideoSlide({ id, src, isActive }) {
  const {
    energy,
    setEnergy,
    setCoins,
    scheduleEnergyPaywallAfterVideo,
    playCoinWinAnimation,
    playLoseFeedback,
  } = useOffers();

  const winningIsLow = useMemo(() => winningIsLowFromId(id), [id]);
  const [chosenBet, setChosenBet] = useState(
    /** @type {null | "x2" | "x10"} */ (null)
  );

  useEffect(() => {
    if (!isActive) {
      setChosenBet(null);
    }
  }, [isActive]);

  function placeBet(isLowButton) {
    if (energy <= 0) {
      return;
    }
    setChosenBet(isLowButton ? "x2" : "x10");
    primeSfxFromUserGesture();
    preloadSfxBases([
      "stack-of-coins",
      "classic-fail-wah-wah-wah-on-the-pipe",
    ]);
    setEnergy((e) => {
      if (e <= 0) return e;
      const next = e - 1;
      if (next === 0) {
        scheduleEnergyPaywallAfterVideo(id);
      }
      return next;
    });
    const isWin =
      (isLowButton && winningIsLow) || (!isLowButton && !winningIsLow);
    if (isWin) {
      vibrateBetWin();
      const multVal = isLowButton ? 2 : 10;
      const delta = Math.round(10 * multVal * (0.8 + Math.random() * 0.4));
      setCoins((c) => c + delta);
      playCoinWinAnimation(delta);
    } else {
      playLoseFeedback();
    }
  }

  const dim = energy <= 0;

  return (
    <section
      className="video-feed__slide"
      data-feed-item
      data-feed-type="video"
      data-feed-id={id}
    >
      <video
        className="video-feed__media"
        data-feed-video
        src={src}
        playsInline
        muted
        loop
        preload="metadata"
      />
      <div className="video-feed__shade" aria-hidden />

      <div className="video-slide__bets">
        <div
          className={`video-slide__bets-row${chosenBet ? " video-slide__bets-row--single" : ""}`}
        >
          {(chosenBet === null || chosenBet === "x2") && (
            <button
              type="button"
              disabled={chosenBet !== null}
              className={`video-slide__btn${dim ? " video-slide__btn--dim" : ""}`}
              onClick={() => placeBet(true)}
            >
              ×2
            </button>
          )}
          {(chosenBet === null || chosenBet === "x10") && (
            <button
              type="button"
              disabled={chosenBet !== null}
              className={`video-slide__btn video-slide__btn--accent${dim ? " video-slide__btn--dim" : ""}`}
              onClick={() => placeBet(false)}
            >
              ×10
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
