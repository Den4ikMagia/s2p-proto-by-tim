import { useCallback, useEffect, useRef, useState } from "react";
import {
  playSfxBase,
  preloadSfxBases,
  primeSfxFromUserGesture,
} from "../audio/sfx";
import { FORTUNE_WHEEL_SEGMENTS } from "../data/offerCardsMock";
import { FortuneWheelOfferModal } from "./FortuneWheelOfferModal";
import "./FortuneWheelSlide.css";

/** public/sounds/koleso-fortunyi--ostanavlivaetsya.mp3 — длительность совпадает с анимацией */
const FORTUNE_SPIN_SFX_BASE = "koleso-fortunyi--ostanavlivaetsya";

const FORTUNE_WHEEL_POINTER_SRC =
  "https://battleme.club/assets/arrow-CscS0JHK.png";

const CX = 150;
const CY = 150;
/** Почти до края viewBox (300×300), минимальный зазор у обода */
const R = 143;
/** Подписи ближе к дуге при большом R */
const LABEL_R = 104;
const SEGMENTS = 6;
const SEG_DEG = 360 / SEGMENTS;

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} a1Deg
 * @param {number} a2Deg
 */
function segmentPath(cx, cy, r, a1Deg, a2Deg) {
  const rad = (d) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(a1Deg));
  const y1 = cy + r * Math.sin(rad(a1Deg));
  const x2 = cx + r * Math.cos(rad(a2Deg));
  const y2 = cy + r * Math.sin(rad(a2Deg));
  const large = Math.abs(a2Deg - a1Deg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

/**
 * @param {{ slideId: string, onDismiss: () => void }} props
 */
export function FortuneWheelSlide({ slideId, onDismiss }) {
  const segments = FORTUNE_WHEEL_SEGMENTS;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [modalOffer, setModalOffer] = useState(null);
  const pendingWinRef = useRef(/** @type {number | null} */ (null));

  useEffect(() => {
    preloadSfxBases([FORTUNE_SPIN_SFX_BASE]);
  }, []);

  const handleSpin = useCallback(() => {
    if (spinning || segments.length < SEGMENTS) return;
    const winIndex = Math.floor(Math.random() * SEGMENTS);
    pendingWinRef.current = winIndex;
    const spins = 5 + Math.floor(Math.random() * 3);
    const offset = 360 - (winIndex * SEG_DEG + SEG_DEG / 2);
    primeSfxFromUserGesture();
    void playSfxBase(FORTUNE_SPIN_SFX_BASE, 0.88);
    setSpinning(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRotation((r) => r + spins * 360 + offset);
      });
    });
  }, [spinning, segments.length]);

  const handleTransitionEnd = useCallback(
    (e) => {
      if (e.propertyName !== "transform") return;
      if (!spinning) return;
      const win = pendingWinRef.current;
      pendingWinRef.current = null;
      setSpinning(false);
      if (win != null && segments[win]) {
        setModalOffer(segments[win]);
      }
    },
    [spinning, segments]
  );

  const handleCloseModal = useCallback(() => {
    setModalOffer(null);
    onDismiss();
  }, [onDismiss]);

  return (
    <div
      className="video-feed__item video-feed__item--fortune"
      data-feed-item
      data-feed-type="fortune_wheel"
      data-feed-id={slideId}
    >
      <div className="fortune-wheel-slide">
        <p className="fortune-wheel-slide__title">Fortune Wheel</p>

        <div className="fortune-wheel-slide__stage">
          <div className="fortune-wheel-slide__pointer" aria-hidden>
            <img
              className="fortune-wheel-slide__pointer-img"
              src={FORTUNE_WHEEL_POINTER_SRC}
              alt=""
              width={72}
              height={72}
              draggable={false}
            />
          </div>

          <div className="fortune-wheel-slide__wheel-wrap">
            <svg
              className={`fortune-wheel-slide__svg${spinning ? " fortune-wheel-slide__svg--animating" : ""}`}
              viewBox="0 0 300 300"
              width="300"
              height="300"
              style={{ transform: `rotate(${rotation}deg)` }}
              onTransitionEnd={handleTransitionEnd}
            >
              {segments.slice(0, SEGMENTS).map((seg, i) => {
                const a1 = -90 + i * SEG_DEG;
                const a2 = -90 + (i + 1) * SEG_DEG;
                const mid = (a1 + a2) / 2;
                const rad = (mid * Math.PI) / 180;
                const tx = CX + LABEL_R * Math.cos(rad);
                const ty = CY + LABEL_R * Math.sin(rad);
                return (
                  <g key={seg.id}>
                    <path
                      d={segmentPath(CX, CY, R, a1, a2)}
                      fill={seg.background_color}
                      stroke="rgba(0,0,0,0.25)"
                      strokeWidth="1"
                    />
                    <g transform={`translate(${tx} ${ty})`}>
                      <image
                        href={seg.logo}
                        x={-20}
                        y={-34}
                        width="40"
                        height="40"
                        preserveAspectRatio="xMidYMid meet"
                      />
                      <text
                        x={0}
                        y={14}
                        textAnchor="middle"
                        fill="#fff"
                        stroke="rgba(0,0,0,0.35)"
                        strokeWidth="0.35"
                        paintOrder="stroke fill"
                        fontSize="11"
                        fontWeight="800"
                      >
                        {seg.title.length > 9
                          ? `${seg.title.slice(0, 8)}…`
                          : seg.title}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            <button
              type="button"
              className="fortune-wheel-slide__spin"
              disabled={spinning}
              onClick={handleSpin}
            >
              SPIN
            </button>
          </div>
        </div>
      </div>

      {modalOffer ? (
        <FortuneWheelOfferModal offer={modalOffer} onClose={handleCloseModal} />
      ) : null}
    </div>
  );
}
