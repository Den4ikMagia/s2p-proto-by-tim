import { useEffect, useMemo, useRef, useState } from "react";
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
 * @param {{ id: string, src: string, isActive: boolean, teaseSwipeActive?: boolean, onSwipeHintShown?: (id: string) => void }} props
 */
export function VideoSlide({
  id,
  src,
  isActive,
  teaseSwipeActive = false,
  onSwipeHintShown,
}) {
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
  const [betsVisible, setBetsVisible] = useState(false);
  const [betButtonExit, setBetButtonExit] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const revealTimerRef = useRef(/** @type {number | null} */ (null));
  const resolveTimerRef = useRef(/** @type {number | null} */ (null));
  const postResultTimerRef = useRef(/** @type {number | null} */ (null));
  const hintTimerRef = useRef(/** @type {number | null} */ (null));
  const swipeHintNotifiedRef = useRef(false);

  useEffect(() => {
    if (revealTimerRef.current != null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (resolveTimerRef.current != null) {
      window.clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    if (postResultTimerRef.current != null) {
      window.clearTimeout(postResultTimerRef.current);
      postResultTimerRef.current = null;
    }
    if (hintTimerRef.current != null) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    if (!isActive) {
      setChosenBet(null);
      setBetsVisible(false);
      setBetButtonExit(false);
      setShowSwipeHint(false);
      swipeHintNotifiedRef.current = false;
      return;
    }
    setBetsVisible(false);
    setBetButtonExit(false);
    setShowSwipeHint(false);
    revealTimerRef.current = window.setTimeout(() => {
      setBetsVisible(true);
      revealTimerRef.current = null;
    }, 1000);
    return () => {
      if (revealTimerRef.current != null) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (resolveTimerRef.current != null) {
        window.clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
      }
      if (postResultTimerRef.current != null) {
        window.clearTimeout(postResultTimerRef.current);
        postResultTimerRef.current = null;
      }
      if (hintTimerRef.current != null) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!showSwipeHint || !isActive) return;
    if (swipeHintNotifiedRef.current) return;
    swipeHintNotifiedRef.current = true;
    onSwipeHintShown?.(id);
  }, [showSwipeHint, isActive, onSwipeHintShown, id]);

  function placeBet(isLowButton) {
    if (!isActive || !betsVisible || chosenBet !== null) {
      return;
    }
    if (energy <= 0) {
      return;
    }
    setChosenBet(isLowButton ? "x2" : "x10");
    primeSfxFromUserGesture();
    preloadSfxBases(["stack-of-coins", "cartoon-fail"]);
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
    resolveTimerRef.current = window.setTimeout(() => {
      if (isWin) {
        vibrateBetWin();
        const multVal = isLowButton ? 2 : 10;
        const delta = Math.round(10 * multVal * (0.8 + Math.random() * 0.4));
        setCoins((c) => c + delta);
        playCoinWinAnimation(delta);
      } else {
        playLoseFeedback();
      }
      postResultTimerRef.current = window.setTimeout(() => {
        setBetButtonExit(true);
        postResultTimerRef.current = null;
        hintTimerRef.current = window.setTimeout(() => {
          setShowSwipeHint(true);
          hintTimerRef.current = null;
        }, 260);
      }, 1100);
      resolveTimerRef.current = null;
    }, 3000);
  }

  const dim = energy <= 0;

  return (
    <section
      className="video-feed__slide"
      data-feed-item
      data-feed-type="video"
      data-feed-id={id}
    >
      <div
        className={`video-feed__slide-inner${teaseSwipeActive ? " video-feed__slide-inner--swipe-tease" : ""}`}
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

        <div className={`video-slide__bets${betsVisible ? " video-slide__bets--visible" : ""}`}>
          <div
            className={`video-slide__bets-row${chosenBet ? " video-slide__bets-row--single" : ""}${betButtonExit ? " video-slide__bets-row--exit" : ""}`}
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

        {showSwipeHint ? (
          <div className="video-slide__swipe-hint" aria-hidden>
            <div className="video-slide__swipe-hint-gradient" />
            <div className="video-slide__swipe-hint-inner">
              <span className="video-slide__swipe-hint-text">SWIPE TO NEXT VIDEO</span>
              <span className="video-slide__swipe-hint-arrow">↓</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
