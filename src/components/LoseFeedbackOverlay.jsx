import { useEffect } from "react";
import { publicUrl } from "../publicUrl";
import "./LoseFeedbackOverlay.css";

const SOUND_SRC = publicUrl("sounds/classic-fail-wah-wah-wah-on-the-pipe.ogg");
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
    const audio = new Audio(SOUND_SRC);
    audio.volume = 0.72;
    void audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
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
