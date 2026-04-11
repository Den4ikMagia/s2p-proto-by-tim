import { useEffect, useMemo } from "react";
import { useOffers } from "../context/OffersContext";
import { publicUrl } from "../publicUrl";
import "./StartBonusModal.css";

const COIN_IMG = publicUrl("coin-fly.png");

const CONFETTI_COLORS = [
  "#22c55e",
  "#ef4444",
  "#eab308",
  "#3b82f6",
  "#a855f7",
  "#f97316",
];

export function StartBonusModal() {
  const { startBonusOpen, claimStartBonus } = useOffers();

  const confetti = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${(i * 17 + 7) % 100}%`,
      top: `${(i * 23) % 85}%`,
      rot: (i * 47) % 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 6) * 0.08,
    }));
  }, []);

  useEffect(() => {
    if (!startBonusOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [startBonusOpen]);

  if (!startBonusOpen) return null;

  return (
    <div
      className="start-bonus-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-bonus-heading"
      onClick={claimStartBonus}
    >
      <div className="start-bonus-modal__confetti" aria-hidden>
        {confetti.map((c) => (
          <span
            key={c.id}
            className="start-bonus-modal__confetti-piece"
            style={{
              left: c.left,
              top: c.top,
              "--rot": `${c.rot}deg`,
              "--delay": `${c.delay}s`,
              backgroundColor: c.color,
            }}
          />
        ))}
      </div>

      <div className="start-bonus-modal__panel">
        <p id="start-bonus-heading" className="start-bonus-modal__tag">
          WELCOME BONUS
        </p>
        <div className="start-bonus-modal__coin-card">
          <img
            src={COIN_IMG}
            alt=""
            className="start-bonus-modal__coin-img"
            width={88}
            height={88}
            draggable={false}
          />
          <span className="start-bonus-modal__amount">100</span>
        </div>
      </div>

      <p className="start-bonus-modal__hint">Нажмите в любое место</p>
    </div>
  );
}
