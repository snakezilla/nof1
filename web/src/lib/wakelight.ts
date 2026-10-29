import { asset } from "./asset";

/**
 * The pictures for the bedside chapter; its words live in projects.json. The 10,000 lux figure for
 * the fold-out sits in the wake timeline (src/lib/wake-timeline.ts), so the captions only name the pictures.
 */
export const WAKELIGHT = {
  clip: {
    src: asset("media/wakelight-bellows.mp4"),
    poster: asset("media/wakelight-bellows-poster.jpg"),
    width: 720,
    height: 1280,
    label:
      "Video: the printed shade of the travel lamp, pressed flat between its yellow base and cap, springs back up.",
    caption: "The travel lamp",
  },
  /* Recorded from the cam viewer (WakeLight share/wakelight-cam-viewer), one frame per degree of
     the base cam, 12 seconds a turn. */
  motion: {
    webm: asset("media/wakelight-motion.webm"),
    mp4: asset("media/wakelight-motion.mp4"),
    poster: asset("media/wakelight-motion-poster.jpg"),
    width: 540,
    height: 960,
    label:
      "Animation: the lamp's top rises, leans and nods in small steps, with a pause between each move, as the cam in its base turns.",
    caption: "How it moves",
  },
  foldout: {
    src: asset("media/wakelight-foldout.jpg"),
    width: 720,
    height: 1280,
    alt: "The fold-out version lit: three glowing panels on a desk, the side panels angled in.",
    caption: "The fold-out version",
  },
} as const;
