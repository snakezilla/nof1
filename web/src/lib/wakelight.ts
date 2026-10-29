/**
 * The pictures for the bedside chapter; its words live in projects.json. The 10,000 lux figure for
 * the fold-out sits in the wake timeline (src/lib/wake-timeline.ts), so the captions only name the pictures.
 */
export const WAKELIGHT = {
  clip: {
    src: "/media/wakelight-bellows.mp4",
    poster: "/media/wakelight-bellows-poster.jpg",
    width: 720,
    height: 1280,
    label:
      "Video: the printed shade of the travel lamp, pressed flat between its yellow base and cap, springs back up.",
    caption: "The travel lamp",
  },
  /* Recorded from the cam viewer (WakeLight share/wakelight-cam-viewer), one frame per degree of
     the base cam, 12 seconds a turn. */
  motion: {
    webm: "/media/wakelight-motion.webm",
    mp4: "/media/wakelight-motion.mp4",
    poster: "/media/wakelight-motion-poster.jpg",
    width: 540,
    height: 960,
    label:
      "Animation: the lamp's top rises, leans and nods in small steps, with a pause between each move, as the cam in its base turns.",
    caption: "How it moves",
  },
} as const;
