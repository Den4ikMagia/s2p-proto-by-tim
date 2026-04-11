import { useMemo } from "react";
import { primeSfxFromUserGesture, preloadSfxBases } from "../audio/sfx";
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
 * @param {{ id: string, src: string }} props
 */
export function VideoSlide({ id, src }) {
  const {
    energy,
    setEnergy,
    setCoins,
    tryEnergyPaywall,
    maybeOfferAfterWin,
    maybeOfferAfterLose,
    playCoinWinAnimation,
    playLoseFeedback,
  } = useOffers();

  const winningIsLow = useMemo(() => winningIsLowFromId(id), [id]);

  function placeBet(isLowButton) {
    if (energy <= 0) {
      tryEnergyPaywall();
      return;
    }
    primeSfxFromUserGesture();
    preloadSfxBases([
      "stack-of-coins",
      "classic-fail-wah-wah-wah-on-the-pipe",
    ]);
    setEnergy((e) => e - 1);
    const isWin =
      (isLowButton && winningIsLow) || (!isLowButton && !winningIsLow);
    if (isWin) {
      const multVal = isLowButton ? 2 : 10;
      const delta = Math.round(10 * multVal * (0.8 + Math.random() * 0.4));
      setCoins((c) => c + delta);
      playCoinWinAnimation(delta);
      maybeOfferAfterWin();
    } else {
      playLoseFeedback();
      maybeOfferAfterLose();
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
        <div className="video-slide__bets-row">
          <button
            type="button"
            className={`video-slide__btn${dim ? " video-slide__btn--dim" : ""}`}
            onClick={() => placeBet(true)}
          >
            ×2
          </button>
          <button
            type="button"
            className={`video-slide__btn video-slide__btn--accent${dim ? " video-slide__btn--dim" : ""}`}
            onClick={() => placeBet(false)}
          >
            ×10
          </button>
        </div>
      </div>
    </section>
  );
}
