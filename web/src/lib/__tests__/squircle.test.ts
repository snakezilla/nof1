import { describe, expect, it } from "vitest";
import { squirclePath } from "../squircle";

const points = (d: string) =>
  [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);

describe("squirclePath", () => {
  it("is one closed path that stays inside its box", () => {
    const d = squirclePath(10, 20, 120, 36, 12);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/M/g)).toHaveLength(1);
    points(d).forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(10);
      expect(x).toBeLessThanOrEqual(130);
      expect(y).toBeGreaterThanOrEqual(20);
      expect(y).toBeLessThanOrEqual(56);
    });
  });

  it("touches all four sides and is mirror symmetric", () => {
    const pts = points(squirclePath(0, 0, 100, 40, 12));
    const xs = pts.map(([x]) => x);
    const ys = pts.map(([, y]) => y);
    expect([
      Math.min(...xs),
      Math.max(...xs),
      Math.min(...ys),
      Math.max(...ys),
    ]).toEqual([0, 100, 0, 40]);
    pts.forEach(([x, y]) =>
      expect(
        pts.some(
          ([a, b]) => Math.abs(a - (100 - x)) < 0.02 && Math.abs(b - y) < 0.02,
        ),
      ).toBe(true),
    );
  });

  it("is squarer than a circular arc: the corner midpoint sits closer to the corner", () => {
    const pts = points(squirclePath(0, 0, 100, 100, 20));
    const nearest = Math.min(...pts.map(([x, y]) => Math.hypot(100 - x, y)));
    const circle = 20 * Math.SQRT2 - 20;
    expect(nearest).toBeLessThan(circle);
  });

  it("clamps the corner to half the shorter side", () => {
    expect(squirclePath(0, 0, 40, 20, 50)).toBe(squirclePath(0, 0, 40, 20, 10));
    expect(squirclePath(0, 0, 40, 20, 0)).toMatch(/^M40 0/);
  });
});
