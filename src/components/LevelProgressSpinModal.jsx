import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  playSfxBase,
  preloadSfxBases,
  primeSfxFromUserGesture,
} from "../audio/sfx";
import { CoinWinFlyover } from "./CoinWinFlyover";
import { LEVEL_SPIN_CONFIG } from "../data/levelSpinMock";
import { publicUrl } from "../publicUrl";
import "./DailyBonusModal.css";
import "./LevelProgressSpinModal.css";

const MULTIPLIERS = [1, 2, 5];
const SEGMENTS_TOTAL = 16;

/** Как в FortuneWheelSlide — длина 4s под анимацию */
const LEVEL_SPIN_SFX_BASE = "koleso-fortunyi--ostanavlivaetsya";

const LEVEL_SPIN_POINTER_SRC =
  "https://battleme.club/assets/arrow-CscS0JHK.png";
const LEVEL_BOX_IMG = publicUrl("level-box.png");
const ENERGY_IMG = publicUrl("energy.png");
const ENERGY_ICON_IMG = publicUrl("energy-icon.png");
const COIN_ICON_IMG = publicUrl("coin-fly.png");
const RAYS_1 = publicUrl("daily-bonus-rays-1.png");
const RAYS_2 = publicUrl("daily-bonus-rays-2.png");
const LEVEL_COMPLETE_ENERGY_REWARD = 60;
const CONFETTI_COLORS = [
  "#22c55e",
  "#ef4444",
  "#eab308",
  "#3b82f6",
  "#a855f7",
  "#f97316",
];

/** Время на таймлайне ролика под текущий прогресс (у многих MP4 t=0 чёрный — для 0 шагов слегка сдвигаем) */
function getVideoTimeForProgress(progressSteps, duration) {
  const max = LEVEL_SPIN_CONFIG.QtyLevelSteps;
  if (!Number.isFinite(duration) || duration <= 0 || max <= 0) return 0;
  if (progressSteps >= max) return Math.max(0, duration - 1e-3);
  if (progressSteps <= 0) return Math.min(1 / 24, duration * 0.01);
  return Math.min(
    Math.max((progressSteps / max) * duration, 0),
    duration - 1e-3
  );
}

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
 * Угол rotate() (mod 360), при котором центр сегмента segmentIndex оказывается под указателем (12ч).
 * Сегменты как в SVG: i-й от -90° + i*segDeg. Учёт накопленного rotation — отдельно через delta.
 */
function rotationModForSegmentCenter(segmentIndex, segDeg) {
  const mid = -90 + segmentIndex * segDeg + segDeg / 2;
  const target = -90 - mid;
  return ((target % 360) + 360) % 360;
}

/**
 * @param {{
 *  coins: number,
 *  energy: number,
 *  onSpendCoins: (amount: number) => void,
 *  onRefundCoins: (amount: number) => void,
 *  onGrantEnergy?: (amount: number) => void,
 *  onEnergyFlyStart?: () => void
 * }} props
 */
export function LevelProgressSpinModal({
  coins,
  energy: _energy,
  onSpendCoins,
  onRefundCoins,
  onGrantEnergy,
  onEnergyFlyStart,
}) {
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [status, setStatus] = useState(
    /** @type {"idle" | "spinning" | "result" | "level_complete" | "collecting_reward"} */ ("idle")
  );
  const [lastResult, setLastResult] = useState(0);
  const [lastRefund, setLastRefund] = useState(0);
  const [collectingReward, setCollectingReward] = useState(false);
  const [energyFxRunId, setEnergyFxRunId] = useState(
    /** @type {number | null} */ (null)
  );
  const pendingSpinRef = useRef(
    /** @type {null | { result: number; cost: number }} */ (null)
  );
  const videoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));
  const videoDurationRef = useRef(0);
  const progressRef = useRef(0);
  const videoSegmentCleanupRef = useRef(() => {});

  const maxSteps = LEVEL_SPIN_CONFIG.QtyLevelSteps;

  useEffect(() => {
    preloadSfxBases([LEVEL_SPIN_SFX_BASE]);
  }, []);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  /** Старт: пауза; кадр по прогрессу после metadata + декод первого кадра (loadeddata) */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const syncFrameToProgress = () => {
      const dur = videoDurationRef.current;
      if (!dur) return;
      el.pause();
      el.currentTime = getVideoTimeForProgress(progressRef.current, dur);
    };
    const onMeta = () => {
      videoDurationRef.current = Number.isFinite(el.duration) ? el.duration : 0;
      syncFrameToProgress();
    };
    const onLoadedData = () => {
      syncFrameToProgress();
    };
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("loadeddata", onLoadedData);
    if (el.readyState >= 1) onMeta();
    if (el.readyState >= 2) onLoadedData();
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("loadeddata", onLoadedData);
    };
  }, [maxSteps]);
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

  /** Проиграть кусок видео: длительность = duration * (result / QtyLevelSteps), от текущего шага к следующему */
  const playVideoSegmentForSteps = useCallback(
    (prevProgress, result) => {
      const video = videoRef.current;
      const dur = videoDurationRef.current;
      if (!video || !dur || result <= 0) return;

      videoSegmentCleanupRef.current();
      video.pause();

      const t0 = (prevProgress / maxSteps) * dur;
      const nextProgress = Math.min(maxSteps, prevProgress + result);
      const t1 = Math.min(dur, (nextProgress / maxSteps) * dur);

      if (t1 <= t0 + 1e-3) return;

      video.currentTime = t0;

      const onTimeUpdate = () => {
        if (video.currentTime >= t1 - 0.05 || video.ended) {
          video.pause();
          video.currentTime = Math.min(t1, dur);
          video.removeEventListener("timeupdate", onTimeUpdate);
          videoSegmentCleanupRef.current = () => {};
        }
      };
      video.addEventListener("timeupdate", onTimeUpdate);
      videoSegmentCleanupRef.current = () => {
        video.removeEventListener("timeupdate", onTimeUpdate);
      };

      void video.play().catch(() => {});
    },
    [maxSteps]
  );

  useEffect(() => {
    return () => videoSegmentCleanupRef.current();
  }, []);

  useEffect(() => {
    if (status !== "level_complete") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [status]);

  const applySpinResult = useCallback(
    (result, cost) => {
      const prevProgress = progressRef.current;
      setLastResult(result);
      if (result === 0) {
        setStatus("result");
        return;
      }
      playVideoSegmentForSteps(prevProgress, result);
      setProgress((prev) => {
        const next = prev + result;
        if (next >= maxSteps) {
          const overflow = next - maxSteps;
          const refund = cost * (overflow / result);
          const roundedRefund = Math.max(0, Math.round(refund));
          if (roundedRefund > 0) onRefundCoins(roundedRefund);
          setLastRefund(roundedRefund);
          setStatus("level_complete");
          return maxSteps;
        }
        setStatus("result");
        return next;
      });
    },
    [maxSteps, onRefundCoins, playVideoSegmentForSteps]
  );

  const handleTransitionEnd = useCallback(
    (e) => {
      if (e.propertyName !== "transform") return;
      if (status !== "spinning") return;
      const pending = pendingSpinRef.current;
      pendingSpinRef.current = null;
      if (!pending) return;
      applySpinResult(pending.result, pending.cost);
    },
    [status, applySpinResult]
  );

  function handleSpin() {
    if (status === "spinning") return;
    if (coins < spinCost) {
      window.alert("Not enough coins");
      return;
    }

    onSpendCoins(spinCost);
    setLastResult(0);
    setLastRefund(0);

    videoSegmentCleanupRef.current();
    videoRef.current?.pause();

    const segmentIndex = Math.floor(Math.random() * wheelSegments.length);
    const result = wheelSegments[segmentIndex] ?? 0;
    const segDeg = 360 / SEGMENTS_TOTAL;
    const spins = 5 + Math.floor(Math.random() * 3);
    const targetRMod = rotationModForSegmentCenter(segmentIndex, segDeg);

    pendingSpinRef.current = { result, cost: spinCost };
    primeSfxFromUserGesture();
    void playSfxBase(LEVEL_SPIN_SFX_BASE, 0.88);
    setStatus("spinning");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRotation((r) => {
          const prevMod = ((r % 360) + 360) % 360;
          const deltaMod = (targetRMod - prevMod + 360) % 360;
          return r + spins * 360 + deltaMod;
        });
      });
    });
  }

  const handleNextLevel = useCallback(() => {
    videoSegmentCleanupRef.current();
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    progressRef.current = 0;
    setLevel((l) => l + 1);
    setProgress(0);
    setLastResult(0);
    setLastRefund(0);
    setCollectingReward(false);
    setEnergyFxRunId(null);
    setStatus("idle");
  }, []);

  function handleCollectReward() {
    if (collectingReward) return;
    setCollectingReward(true);
    setStatus("collecting_reward");
    onGrantEnergy?.(LEVEL_COMPLETE_ENERGY_REWARD);
    setEnergyFxRunId(Date.now());
  }

  const formatCoins = (n) => new Intl.NumberFormat("ru-RU").format(n);

  return (
    <section className="level-spin" data-feed-item data-feed-type="level_spin">
      <video
        ref={videoRef}
        className="level-spin__video"
        src={LEVEL_SPIN_CONFIG.video_url}
        muted
        playsInline
        preload="auto"
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
          <img
            className="level-spin__pointer-img"
            src={LEVEL_SPIN_POINTER_SRC}
            alt=""
            width={72}
            height={72}
            draggable={false}
          />
        </div>
        <div className="level-spin__wheel-stack">
          <div
            className={`level-spin__wheel-rot${status === "spinning" ? " level-spin__wheel-rot--animating" : ""}`}
            style={{ transform: `rotate(${rotation}deg)` }}
            onTransitionEnd={handleTransitionEnd}
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
        <div
          className="daily-bonus-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-complete-title"
          onClick={handleCollectReward}
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
                src={LEVEL_BOX_IMG}
                alt=""
                className="daily-bonus-modal__fire level-spin__complete-box"
                width={96}
                height={96}
                draggable={false}
              />
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
                <p id="level-complete-title" className="daily-bonus-modal__headline">
                  Уровень {level} пройден!
                </p>
                <img
                  src={ENERGY_IMG}
                  alt=""
                  className="level-spin__complete-energy"
                  width={72}
                  height={72}
                  draggable={false}
                />
                <p className="daily-bonus-modal__reward">
                  <span className="daily-bonus-modal__reward-num">
                    Твой гранд-приз
                  </span>
                  <span className="daily-bonus-modal__reward-rest">
                    {" "}х{LEVEL_COMPLETE_ENERGY_REWARD}{" "}
                    <img
                      src={ENERGY_ICON_IMG}
                      alt=""
                      className="level-spin__inline-icon"
                      width={18}
                      height={18}
                      draggable={false}
                    />
                  </span>
                </p>
                {lastRefund > 0 ? (
                  <p className="level-spin__complete-refund">
                    Возврат: {formatCoins(lastRefund)}
                    <img
                      src={COIN_ICON_IMG}
                      alt=""
                      className="level-spin__inline-icon"
                      width={16}
                      height={16}
                      draggable={false}
                    />
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <p className="daily-bonus-modal__hint">
            {collectingReward ? "Collecting..." : "Tap to collect"}
          </p>
        </div>
      ) : null}
      {energyFxRunId != null ? (
        <CoinWinFlyover
          amount={LEVEL_COMPLETE_ENERGY_REWARD}
          runId={energyFxRunId}
          iconSrc={ENERGY_ICON_IMG}
          flyTarget="energy"
          badgeTone="energy"
          onCoinsFlyStart={onEnergyFlyStart}
          onComplete={handleNextLevel}
        />
      ) : null}
    </section>
  );
}
