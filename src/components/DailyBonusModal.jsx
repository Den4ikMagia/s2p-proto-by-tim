import { useEffect, useMemo } from "react";
import { useOffers } from "../context/OffersContext";
import { publicUrl } from "../publicUrl";
import "./DailyBonusModal.css";

const FIRE_IMG = publicUrl("daily-bonus-fire.png");
const RAYS_1 = publicUrl("daily-bonus-rays-1.png");
const RAYS_2 = publicUrl("daily-bonus-rays-2.png");

const CONFETTI_COLORS = [
  "#22c55e",
  "#ef4444",
  "#eab308",
  "#3b82f6",
  "#a855f7",
  "#f97316",
];

export function DailyBonusModal() {
  const { dailyBonusOpen, claimDailyBonus } = useOffers();

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
    if (!dailyBonusOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [dailyBonusOpen]);

  if (!dailyBonusOpen) return null;

  return (
    <div
      className="daily-bonus-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-bonus-title"
      onClick={claimDailyBonus}
    >
      <div className="daily-bonus-modal__confetti" aria-hidden>
        {confetti.map((c) => (
          <span
            key={c.id}
            className="daily-bonus-modal__confetti-piece"
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

      <div className="daily-bonus-modal__card">
        <div className="daily-bonus-modal__booster" aria-hidden>
          <img
            src={FIRE_IMG}
            alt=""
            className="daily-bonus-modal__fire"
            width={96}
            height={96}
            draggable={false}
          />
          <span className="daily-bonus-modal__x5">×5</span>
          <div className="daily-bonus-modal__rays">
            <img
              src={RAYS_1}
              alt=""
              className="daily-bonus-modal__ray daily-bonus-modal__ray--1"
              draggable={false}
            />
            <img
              src={RAYS_2}
              alt=""
              className="daily-bonus-modal__ray daily-bonus-modal__ray--2"
              draggable={false}
            />
          </div>
        </div>

        <div className="daily-bonus-modal__body">
          <div className="daily-bonus-modal__body-content">
            <p id="daily-bonus-title" className="daily-bonus-modal__headline">
              Забери свой дейли бонус!
            </p>

            <div className="daily-bonus-modal__streaks" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`daily-bonus-modal__streak-slot${
                    i < 5 ? " daily-bonus-modal__streak-slot--filled" : ""
                  }`}
                >
                  {i < 5 ? (
                    <img
                      src={FIRE_IMG}
                      alt=""
                      className="daily-bonus-modal__streak-fire"
                      width={18}
                      height={18}
                      draggable={false}
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <p className="daily-bonus-modal__reward">
              <span className="daily-bonus-modal__reward-num">500</span>
              <span className="daily-bonus-modal__reward-rest">
                {" "}
                монет за 5 дней подряд
              </span>
            </p>
          </div>
        </div>
      </div>

      <p className="daily-bonus-modal__hint">Tap to collect</p>
    </div>
  );
}
