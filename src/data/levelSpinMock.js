import { publicUrl } from "../publicUrl";

export const LEVEL_SPIN_CONFIG = {
  QtyLevelSteps: 100,
  SpinCost: 20,
  step_values: [10, 25, 40, 50, 60, 70, 85, 100],
  zero_segments: 8,
  /** public/videos — через publicUrl, иначе на GitHub Pages ломается путь /videos/... */
  video_url: publicUrl("videos/level_journey.mp4"),
};
