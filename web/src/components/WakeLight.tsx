import { WAKELIGHT } from "../lib/wakelight";

const REDUCE = "(prefers-reduced-motion: reduce)";

/* React leaves `muted` out of server HTML, so as a prop it breaks hydration. Set it on mount; the
   clips have no sound track either way. */
const mute = (v: HTMLVideoElement | null) => {
  if (v) {
    v.defaultMuted = true;
    v.muted = true;
  }
};

/* The motion loops while it is on screen. Under reduced motion, or where the browser will not
   play it, it holds its poster and offers controls instead. */
const loopWhileSeen = (v: HTMLVideoElement | null) => {
  if (!v) return;
  mute(v);
  const still = () => {
    v.controls = true;
  };
  if (!window.matchMedia || window.matchMedia(REDUCE).matches) return still();
  if (!("IntersectionObserver" in window)) return still();
  const io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) v.play().catch(still);
    else v.pause();
  });
  io.observe(v);
  return () => io.disconnect();
};

/**
 * The WakeLight step's pictures: the travel lamp's clip (never plays by itself) and the lamp's
 * motion (a silent loop, still under reduced motion), side by side at one height, each with a
 * short label.
 */
export function WakeLightMedia() {
  const { clip, motion, foldout } = WAKELIGHT;
  return (
    <div className="feature__media">
      <figure>
        <video
          ref={mute}
          width={clip.width}
          height={clip.height}
          poster={clip.poster}
          aria-label={clip.label}
          controls
          playsInline
          loop
          preload="none"
        >
          <source src={clip.src} type="video/mp4" />
        </video>
        <figcaption>{clip.caption}</figcaption>
      </figure>
      <figure>
        <video
          ref={loopWhileSeen}
          width={motion.width}
          height={motion.height}
          poster={motion.poster}
          aria-label={motion.label}
          playsInline
          loop
          preload="none"
        >
          <source src={motion.webm} type="video/webm" />
          <source src={motion.mp4} type="video/mp4" />
        </video>
        <figcaption>{motion.caption}</figcaption>
      </figure>
      <figure>
        <img
          src={foldout.src}
          width={foldout.width}
          height={foldout.height}
          alt={foldout.alt}
          loading="lazy"
          decoding="async"
        />
        <figcaption>{foldout.caption}</figcaption>
      </figure>
    </div>
  );
}
