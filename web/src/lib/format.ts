export const hoursLabel = (h: number): string => {
  const total = Math.round(h * 60);
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  return mins === 0 ? `${hrs} h` : `${hrs} h ${mins} m`;
};

export const workoutLabel = (types: readonly string[]): string =>
  types.length === 0
    ? "workout"
    : types
        .map((t) => t.replace(/_/g, " "))
        .join(", ")
        .replace(/^./, (c) => c.toUpperCase());

export const countLabel = (n: number, one: string, many: string): string =>
  `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** 23.5 -> "11:30 pm", 25 -> "1:00 am". Input runs past midnight. */
export const clockLabel = (decimalHour: number): string => {
  const total = Math.round((((decimalHour % 24) + 24) % 24) * 60) % 1440;
  const h24 = Math.floor(total / 60);
  const mins = String(total % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mins} ${h24 < 12 ? "am" : "pm"}`;
};
