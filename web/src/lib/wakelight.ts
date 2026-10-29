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
  /* Rebuilt from trifold-10k/concept/concept.scad and drawn lit; 10,000 lux is computed, not measured. */
  foldout: {
    src: "/media/wakelight-foldout.jpg",
    width: 720,
    height: 1280,
    alt: "Render of the fold-out version lit: three glowing panels on a desk, the side panels angled in.",
    caption: "The fold-out version, rendered",
  },
} as const;
