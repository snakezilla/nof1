/**
 * WakeLight, the one project in the aside with pictures. The figures behind the two lines are
 * cited in DESIGN.md ("WakeLight"), not on the page. 10,000 lux is the fold-out concept's computed
 * figure (trifold-10k/calc/optics.py), so the copy says "on paper"; the travel lamp gets no figure.
 */
export const WAKELIGHT = {
  line: "A sunrise lamp for travel",
  emphasis: "sunrise lamp",
  href: "https://www.byahsan.com/projects/wakelight",
  why: "My Philips wake-up light gave a few hundred lux, and morning light routines call for far more.",
  what: "I'm building a travel lamp now, and on paper a fold-out version reaches 10,000 lux at about 30 W.",
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
