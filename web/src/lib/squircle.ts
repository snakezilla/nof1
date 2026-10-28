/** Apple-style corners: a rectangle whose corners are superellipse quarters, not circular arcs. */

const EXPONENT = 5;
const STEPS = 8;

const round = (n: number): string => String(Math.round(n * 100) / 100);

/** One corner, from angle a0 to a1 (degrees, counter-clockwise from +x), around (cx, cy). */
const corner = (
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  n: number,
): readonly (readonly [number, number])[] =>
  Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = ((a0 + ((a1 - a0) * i) / STEPS) * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [
      cx + r * Math.sign(c) * Math.abs(c) ** (2 / n),
      cy - r * Math.sign(s) * Math.abs(s) ** (2 / n),
    ] as const;
  });

/**
 * A closed SVG path for a w by h squircle at (x, y). The corner size r is clamped to half the
 * shorter side; n is the superellipse exponent (2 is a circle, higher is squarer).
 */
export const squirclePath = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  n = EXPONENT,
): string => {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  const points = [
    ...corner(x + w - k, y + k, k, 90, 0, n),
    ...corner(x + w - k, y + h - k, k, 0, -90, n),
    ...corner(x + k, y + h - k, k, -90, -180, n),
    ...corner(x + k, y + k, k, 180, 90, n),
  ];
  const [first, ...rest] = points;
  return `M${round(first[0])} ${round(first[1])}${rest
    .map(([px, py]) => `L${round(px)} ${round(py)}`)
    .join("")}Z`;
};
