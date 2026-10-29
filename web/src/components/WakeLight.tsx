import { WAKELIGHT } from "../lib/wakelight";

/* React leaves `muted` out of server HTML, so as a prop it breaks hydration. Set it on mount; the
   clip has no sound track either way. */
const mute = (v: HTMLVideoElement | null) => {
  if (v) {
    v.defaultMuted = true;
    v.muted = true;
  }
};

/**
 * The WakeLight step's pictures: the travel lamp's clip (never plays by itself) and the fold-out
 * render side by side at one height, each with a short label.
 */
export function WakeLightMedia() {
  const { clip, foldout } = WAKELIGHT;
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
