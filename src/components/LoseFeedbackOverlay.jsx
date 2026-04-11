import { useEffect } from "react";
import { playSfxBase } from "../audio/sfx";
import "./LoseFeedbackOverlay.css";
const FX_MS = 780;

/**
 * @param {{ runId: number, onComplete: () => void }} props
 */
export function LoseFeedbackOverlay({ runId, onComplete }) {
  useEffect(() => {
    const t = window.setTimeout(() => onComplete(), FX_MS);
    return () => window.clearTimeout(t);
  }, [runId, onComplete]);

  useEffect(() => {
    void playSfxBase("classic-fail-wah-wah-wah-on-the-pipe", 0.72);
  }, [runId]);

  return (
    <div className="lose-fx" aria-hidden>
      <div className="lose-fx__edges">
        <div className="lose-fx__edge lose-fx__edge--left" />
        <div className="lose-fx__edge lose-fx__edge--right" />
      </div>
    </div>
  );
}
