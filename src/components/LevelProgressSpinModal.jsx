import { useMemo, useState } from "react";
import { LEVEL_SPIN_CONFIG } from "../data/levelSpinMock";
import "./LevelProgressSpinModal.css";

const MULTIPLIERS = [1, 2, 5];
const SEGMENTS_TOTAL = 16;

/**
 * @param {{
 *  coins: number,
 *  energy: number,
 *  onSpendCoins: (amount: number) => void,
 *  onRefundCoins: (amount: number) => void
 * }} props
 */
export function LevelProgressSpinModal({
  coins,
  energy,
  onSpendCoins,
  onRefundCoins,
}) {
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [spinDurationMs, setSpinDurationMs] = useState(2500);
  const [status, setStatus] = useState(
    /** @type {"idle" | "spinning" | "result" | "level_complete"} */ ("idle")
  );
  const [lastResult, setLastResult] = useState(0);
  const [lastRefund, setLastRefund] = useState(0);

  const maxSteps = LEVEL_SPIN_CONFIG.QtyLevelSteps;
  const spinCost = LEVEL_SPIN_CONFIG.SpinCost * multiplier;
  const stepValues = useMemo(
    () => LEVEL_SPIN_CONFIG.step_values.map((v) => v * multiplier),
    [multiplier]
  );
  const wheelSegments = useMemo(() => {
    const zeroes = Array.from(
      { length: LEVEL_SPIN_CONFIG.zero_segments },
      () => 0
    );
    return [...zeroes, ...stepValues].slice(0, SEGMENTS_TOTAL);
  }, [stepValues]);

  const progressPct = Math.max(0, Math.min(100, (progress / maxSteps) * 100));
  const horsePct = progressPct;

  function handleSpin() {
    if (status === "spinning") return;
    if (coins < spinCost) {
      window.alert("Not enough coins");
      return;
    }

    onSpendCoins(spinCost);
    setStatus("spinning");
    setLastResult(0);
    setLastRefund(0);

    const segmentIndex = Math.floor(Math.random() * wheelSegments.length);
    const result = wheelSegments[segmentIndex] ?? 0;
    const segDeg = 360 / SEGMENTS_TOTAL;
    const spins = 5 + Math.floor(Math.random() * 3);
    const offset = 360 - (segmentIndex * segDeg + segDeg / 2);
    const duration = 2200 + Math.floor(Math.random() * 900);
    setSpinDurationMs(duration);
    setRotation((r) => r + spins * 360 + offset);

    window.setTimeout(() => {
      setLastResult(result);
      if (result === 0) {
        setStatus("result");
        return;
      }

      const nextProgress = progress + result;
      if (nextProgress >= maxSteps) {
        const overflow = nextProgress - maxSteps;
        const refund = spinCost * (overflow / result);
        const roundedRefund = Math.max(0, Math.round(refund));
        if (roundedRefund > 0) onRefundCoins(roundedRefund);
        setProgress(maxSteps);
        setLastRefund(roundedRefund);
        setStatus("level_complete");
      } else {
        setProgress(nextProgress);
        setStatus("result");
      }
    }, duration + 40);
  }

  function handleNextLevel() {
    setLevel((l) => l + 1);
    setProgress(0);
    setLastResult(0);
    setLastRefund(0);
    setStatus("idle");
  }

  return (
    <section className="level-spin" data-feed-item data-feed-type="level_spin">
      <div className="level-spin__sheet">
        <div className="level-spin__top">
          <span>Coins: {new Intl.NumberFormat("ru-RU").format(coins)}</span>
          <span>Energy: {energy}</span>
          <span>Level {level}</span>
        </div>

        <div className="level-spin__arena">
          <video
            className="level-spin__video"
            src={LEVEL_SPIN_CONFIG.video_url}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="level-spin__shade" />
          <div className="level-spin__progress-wrap">
            <div className="level-spin__progress-head">
              <span>Progress</span>
              <span>
                {progress}/{maxSteps}
              </span>
            </div>
            <div className="level-spin__track">
              <div
                className="level-spin__track-fill"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="level-spin__horse"
                style={{ left: `calc(${horsePct}% - 12px)` }}
                aria-hidden
              >
                🐎
              </div>
            </div>
          </div>
        </div>

        <div className="level-spin__wheel-zone">
          <div className="level-spin__pointer" aria-hidden>
            ▼
          </div>
          <div
            className={`level-spin__wheel${status === "spinning" ? " level-spin__wheel--spinning" : ""}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: `${spinDurationMs}ms`,
            }}
          >
            {wheelSegments.map((v, i) => (
              <div
                key={`${v}-${i}`}
                className={`level-spin__segment${v === 0 ? " level-spin__segment--zero" : ""}`}
                style={{ "--idx": i, "--total": SEGMENTS_TOTAL }}
              >
                <span>{v === 0 ? "0" : `+${v}`}</span>
              </div>
            ))}
            <div className="level-spin__hub" />
          </div>
        </div>

        <div className="level-spin__multis">
          {MULTIPLIERS.map((m) => (
            <button
              key={m}
              type="button"
              className={`level-spin__multi${multiplier === m ? " level-spin__multi--active" : ""}`}
              onClick={() => setMultiplier(m)}
              disabled={status === "spinning"}
            >
              x{m}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="level-spin__go"
          onClick={handleSpin}
          disabled={status === "spinning"}
        >
          {status === "spinning" ? "SPINNING..." : `GO (${spinCost} coins)`}
        </button>

        {status === "result" ? (
          <div className="level-spin__state">
            {lastResult > 0 ? (
              <span>Great! +{lastResult} steps</span>
            ) : (
              <span>Fail state (0 steps)</span>
            )}
          </div>
        ) : null}

        {status === "level_complete" ? (
          <div className="level-spin__state level-spin__state--complete">
            <strong>LEVEL COMPLETE</strong>
            <span>
              Refund: {new Intl.NumberFormat("ru-RU").format(lastRefund)} coins
            </span>
            <button type="button" onClick={handleNextLevel}>
              Next level
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
