/**
 * The pictures for the WakeLight step of the aside; its words live in projects.json. 10,000 lux is
 * the fold-out concept's computed figure (trifold-10k/calc/optics.py), so the label says "on paper".
 */
export const WAKELIGHT = {
  clip: {
    src: "/media/wakelight-bellows.mp4",
    poster: "/media/wakelight-bellows-poster.jpg",
    width: 720,
    height: 1280,
    label:
      "Video: the printed shade of the travel lamp, pressed flat between its yellow base and cap, springs back up.",
    caption: "Now: the travel lamp",
  },
  /* Rebuilt from trifold-10k/concept/concept.scad and drawn lit; 10,000 lux is computed, not measured. */
  foldout: {
    src: "/media/wakelight-foldout.jpg",
    width: 720,
    height: 1280,
    alt: "Render of the fold-out version lit: three glowing panels on a desk, the side panels angled in.",
    caption: "Next: fold-out, 10,000 lux on paper",
  },
} as const;
