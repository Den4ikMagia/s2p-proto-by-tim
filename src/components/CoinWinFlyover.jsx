import { useEffect, useMemo, useRef, useState } from "react";
import { publicUrl } from "../publicUrl";
import "./CoinWinFlyover.css";

const COIN_IMG = publicUrl("coin-fly.png");
const SOUND_SRC = publicUrl("sounds/stack-of-coins.ogg");
const PARTICLE_COUNT = 22;

/**
 * @param {{
 *   amount: number,
 *   runId: number,
 *   onComplete: () => void,
 *   onCoinsFlyStart?: () => void,
 * }} props
 */
export function CoinWinFlyover({ amount, runId, onComplete, onCoinsFlyStart }) {
  const [phase, setPhase] = useState(
    /** @type {'gather' | 'badge' | 'badgeExit' | 'coinsFly'} */ ("gather")
  );
  const flyStartedRef = useRef(false);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: `${runId}-${i}`,
      tx: (Math.random() - 0.5) * 300,
      ty: (Math.random() - 0.5) * 340,
      rot: (Math.random() - 0.5) * 100,
      delay: i * 0.022,
      size: 32 + Math.floor(Math.random() * 14),
    }));
  }, [runId]);

  useEffect(() => {
    setPhase("gather");
    flyStartedRef.current = false;
  }, [runId]);

  useEffect(() => {
    const tBadge = window.setTimeout(() => setPhase("badge"), 520);
    const tBadgeExit = window.setTimeout(() => setPhase("badgeExit"), 1150);
    const tCoinsFly = window.setTimeout(() => setPhase("coinsFly"), 1360);
    const tDone = window.setTimeout(() => onComplete(), 2180);
    return () => {
      window.clearTimeout(tBadge);
      window.clearTimeout(tBadgeExit);
      window.clearTimeout(tCoinsFly);
      window.clearTimeout(tDone);
    };
  }, [runId, onComplete]);

  useEffect(() => {
    if (phase !== "coinsFly" || flyStartedRef.current) return;
    flyStartedRef.current = true;
    onCoinsFlyStart?.();
    try {
      const audio = new Audio(SOUND_SRC);
      audio.volume = 0.55;
      void audio.play();
    } catch {
      /* ignore */
    }
  }, [phase, onCoinsFlyStart]);

  const formatted = new Intl.NumberFormat("ru-RU").format(amount);

  return (
    <div className="coin-win-fx" aria-hidden>
      <div
        className={`coin-win-fx__cluster coin-win-fx__cluster--${phase}`}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="coin-win-fx__coin"
            style={{
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
              backgroundImage: `url(${COIN_IMG})`,
            }}
          />
        ))}

        {(phase === "badge" || phase === "badgeExit") && (
          <div
            className={`coin-win-fx__badge${phase === "badgeExit" ? " coin-win-fx__badge--exit" : ""}`}
          >
            <span className="coin-win-fx__badge-plus">+</span>
            <span className="coin-win-fx__badge-val">{formatted}</span>
            <img
              className="coin-win-fx__badge-coin"
              src={COIN_IMG}
              alt=""
              width={44}
              height={44}
            />
          </div>
        )}
      </div>
    </div>
  );
}
