export type Series = readonly (number | null)[];

/** Centered rolling mean that skips nulls; null where the window has no values. */
export const rollingMean = (values: Series, size: number): Series => {
  const half = Math.floor(size / 2);
  return values.map((_, i) => {
    const slice = values
      .slice(Math.max(0, i - half), i + half + 1)
      .filter((v): v is number => v !== null);
    return slice.length === 0
      ? null
      : slice.reduce((a, b) => a + b, 0) / slice.length;
  });
};

export const extent = (values: Series): readonly [number, number] | null => {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length === 0 ? null : [Math.min(...nums), Math.max(...nums)];
};

export const xAt = (index: number, count: number, width: number): number =>
  count <= 1 ? width / 2 : (index / (count - 1)) * width;

export const yAt = (
  value: number,
  [min, max]: readonly [number, number],
  height: number,
  pad: number,
): number => {
  const inner = height - pad * 2;
  return max === min
    ? height / 2
    : pad + inner - ((value - min) / (max - min)) * inner;
};

const fmt = (n: number): string => String(Math.round(n * 10) / 10);

/** SVG path for a series. Nulls break the line into separate segments. */
export const linePath = (
  values: Series,
  width: number,
  height: number,
  pad = 2,
): string => {
  const range = extent(values);
  if (!range) return "";
  return values
    .map((v, i) => ({ v, i }))
    .reduce<{ d: readonly string[]; open: boolean }>(
      (acc, { v, i }) => {
        if (v === null) return { d: acc.d, open: false };
        const cmd = `${acc.open ? "L" : "M"}${fmt(xAt(i, values.length, width))} ${fmt(yAt(v, range, height, pad))}`;
        return { d: [...acc.d, cmd], open: true };
      },
      { d: [], open: false },
    )
    .d.join(" ");
};

export const mean = (values: Series): number | null => {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length === 0
    ? null
    : nums.reduce((a, b) => a + b, 0) / nums.length;
};

/** "52 ms recent, 54 ms overall", or a plain note when part of it is missing. */
export const summaryLabel = (
  recent: number | null,
  overall: number | null,
  fmt: (v: number) => string,
): string => {
  if (overall === null) return "no readings";
  if (recent === null)
    return `${fmt(overall)} overall, none in the listed days`;
  return `${fmt(recent)} recent, ${fmt(overall)} overall`;
};

export const countPresent = (values: Series): number =>
  values.filter((v) => v !== null).length;

/** A metric gets its own sparkline only with enough days behind it. */
export const MIN_DAYS_FOR_LINE = 30;
