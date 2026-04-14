import { useMemo, useState } from "react";
import { LEVEL_SPIN_CONFIG } from "../data/levelSpinMock";
import "./LevelProgressSpinModal.css";

const MULTIPLIERS = [1, 2, 5];
const SEGMENTS_TOTAL = 16;

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} a1Deg
 * @param {number} a2Deg
 */
function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

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
  energy: _energy,
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
  /** Чередование пустого и призового сегмента по кругу */
  const wheelSegments = useMemo(() => {
    const out = [];
    for (let i = 0; i < 8; i++) {
      out.push(0);
      out.push(stepValues[i] ?? 0);
    }
    return out;
  }, [stepValues]);

  const progressPct = Math.max(0, Math.min(100, (progress / maxSteps) * 100));

  const segmentPaths = useMemo(() => {
    const cx = 100;
    const cy = 100;
    const rOuter = 100;
    /* Внутренний радиус ≈ под круг GO 88px + рамка: ~25 ед. из 100 (диаметр ~50 в юнитах) */
    const rInner = 25;
    const segDeg = 360 / SEGMENTS_TOTAL;
    const paths = [];
    for (let i = 0; i < SEGMENTS_TOTAL; i++) {
      const a1 = -90 + i * segDeg;
      const a2 = -90 + (i + 1) * segDeg;
      const [ix1, iy1] = polar(cx, cy, rInner, a1);
      const [ox1, oy1] = polar(cx, cy, rOuter, a1);
      const [ox2, oy2] = polar(cx, cy, rOuter, a2);
      const [ix2, iy2] = polar(cx, cy, rInner, a2);
      const large = 0;
      const d = `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${rOuter} ${rOuter} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${rInner} ${rInner} 0 ${large} 0 ${ix1} ${iy1} Z`;
      const mid = (a1 + a2) / 2;
      const labelR = (rInner + rOuter) / 2;
      const [lx, ly] = polar(cx, cy, labelR, mid);
      const value = wheelSegments[i] ?? 0;
      paths.push({
        d,
        fill: value > 0 ? "#dc2626" : "#ffffff",
        stroke: "rgba(0,0,0,0.15)",
        label: value > 0 ? String(value) : "",
        lx,
        ly,
        rot: mid + 90,
      });
    }
    return paths;
  }, [wheelSegments]);

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

  const formatCoins = (n) => new Intl.NumberFormat("ru-RU").format(n);

  return (
    <section className="level-spin" data-feed-item data-feed-type="level_spin">
      <video
        className="level-spin__video"
        src={LEVEL_SPIN_CONFIG.video_url}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="level-spin__shade" aria-hidden />

      <div className="level-spin__v-progress" aria-hidden>
        <div className="level-spin__v-progress-label">Grand Prize</div>
        <div className="level-spin__v-progress-track">
          <div
            className="level-spin__v-progress-fill"
            style={{ height: `${progressPct}%` }}
          />
        </div>
        <div className="level-spin__v-progress-foot">
          {progress}/{maxSteps}
        </div>
      </div>

      <div className="level-spin__wheel-mask">
        <div className="level-spin__pointer" aria-hidden>
          <svg width="36" height="28" viewBox="0 0 36 28">
            <path
              d="M18 0 L36 28 L0 28 Z"
              fill="#a855f7"
              stroke="#fbbf24"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="level-spin__wheel-stack">
          <div
            className="level-spin__wheel-rot"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: `${spinDurationMs}ms`,
            }}
          >
            <svg
              className="level-spin__wheel-svg"
              viewBox="0 0 200 200"
              aria-hidden
            >
              {segmentPaths.map((seg, i) => (
                <g key={i}>
                  <path d={seg.d} fill={seg.fill} stroke={seg.stroke} />
                  {seg.label ? (
                    <text
                      x={seg.lx}
                      y={seg.ly}
                      fill="#fff"
                      fontSize="11"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${seg.rot}, ${seg.lx}, ${seg.ly})`}
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                    >
                      {seg.label}
                    </text>
                  ) : null}
                </g>
              ))}
            </svg>
          </div>
          <div className="level-spin__hub">
            {/* <span className="level-spin__hub-coins">{formatCoins(coins)}</span> */}
            <button
              type="button"
              className="level-spin__go"
              onClick={handleSpin}
              disabled={status === "spinning"}
            >
              {status === "spinning" ? "…" : "GO!"}
            </button>
            {/* <span className="level-spin__hub-hint">HOLD FOR AUTO SPIN</span> */}
          </div>
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

      {status === "result" ? (
        <div className="level-spin__state">
          {lastResult > 0 ? (
            <span>+{lastResult} шагов</span>
          ) : (
            <span>Мимо</span>
          )}
        </div>
      ) : null}

      {status === "level_complete" ? (
        <div className="level-spin__state level-spin__state--complete">
          <strong>LEVEL COMPLETE</strong>
          <span>Возврат: {formatCoins(lastRefund)}</span>
          <button type="button" onClick={handleNextLevel}>
            Дальше
          </button>
        </div>
      ) : null}
    </section>
  );
}
