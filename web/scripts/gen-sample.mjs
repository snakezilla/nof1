// Writes realistic sample data that follows DATA_SCHEMA.md.
// Writes src/fixtures/ only. Real files go in public/data/ and come from prep/.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FROM = "2022-07-15";
const TO = "2026-05-13";

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(42);
const gauss = () =>
  Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
const round1 = (x) => Math.round(x * 10) / 10;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

const dates = (() => {
  const out = [];
  for (
    let d = new Date(FROM + "T00:00:00Z");
    d <= new Date(TO + "T00:00:00Z");
    d = new Date(d.getTime() + 86400000)
  ) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
})();

// Fixed gaps (watch off, travel) plus some random single empty days.
const gapRanges = [
  ["2022-11-02", "2022-11-19"],
  ["2023-06-10", "2023-06-14"],
  ["2024-01-20", "2024-02-11"],
  ["2025-08-03", "2025-08-08"],
  ["2026-03-28", "2026-04-02"],
  ["2026-04-21", "2026-04-23"],
];
const inGap = (d) =>
  gapRanges.some(([a, b]) => d >= a && d <= b) || rand() < 0.02;
const hasStages = (d) => d >= "2023-09-20";
const workoutKinds = ["running", "strength", "cycling", "walking", "yoga"];

const makeDay = (date, prevSleep) => {
  if (inGap(date)) {
    return {
      date,
      hrv_ms: null,
      hrv_n: 0,
      sleep_h: null,
      deep_h: null,
      rem_h: null,
      workout_min: 0,
      workout_types: [],
      mindful_min: 0,
      awake_min: null,
      bed_h: null,
    };
  }
  const sleepMissing = rand() < 0.06;
  const sleep = sleepMissing
    ? null
    : round1(clamp(6.7 + gauss() * 0.9, 3.8, 9.4));
  const sleepEffect = prevSleep == null ? 0 : (prevSleep - 6.7) * 3.2;
  const hrvMissing = rand() < 0.04;
  const hrv = hrvMissing
    ? null
    : round1(clamp(53 + sleepEffect + gauss() * 7, 24, 95));
  const worked = rand() < 0.52;
  const types = worked
    ? [workoutKinds[Math.floor(rand() * workoutKinds.length)]]
    : [];
  const stages = sleep != null && hasStages(date);
  return {
    date,
    hrv_ms: hrv,
    hrv_n: hrv == null ? 0 : 4 + Math.floor(rand() * 14),
    sleep_h: sleep,
    deep_h: stages
      ? round1(clamp(sleep * 0.16 + gauss() * 0.2, 0.3, 2.2))
      : null,
    rem_h: stages
      ? round1(clamp(sleep * 0.21 + gauss() * 0.25, 0.4, 2.6))
      : null,
    workout_min: worked ? Math.round(clamp(38 + gauss() * 15, 10, 110)) : 0,
    workout_types: types,
    mindful_min: rand() < 0.28 ? [3, 5, 10, 15][Math.floor(rand() * 4)] : 0,
    awake_min:
      sleep == null ? null : Math.round(clamp(22 + gauss() * 10, 2, 70)),
    bed_h:
      sleep == null
        ? null
        : Math.round(clamp(23.9 + gauss() * 0.7, 21.5, 27) * 12) / 12,
  };
};

const daily = dates.reduce(
  (acc, date) => [
    ...acc,
    makeDay(date, acc.length ? acc[acc.length - 1].sleep_h : null),
  ],
  [],
);

const patterns = [
  {
    id: "short-sleep-hrv",
    title: "Short nights cost me HRV the next morning",
    finding:
      "After nights under 6 hours my next-day HRV ran about 9 ms lower than after nights of 7 hours or more.",
    numbers: {
      a_label: "nights under 6 h",
      a_value: "48 ms next morning",
      b_label: "nights 7 h or more",
      b_value: "57 ms",
      n_a: 283,
      n_b: 410,
      window: "Jul 2022 to May 2026",
    },
    caveat:
      "Short nights often follow late work or travel, so sleep may not be the only cause.",
  },
  {
    id: "training-day-sleep",
    title: "I sleep longer on days I train",
    finding:
      "On days with a workout of 30 minutes or more I slept about 25 minutes longer that night.",
    numbers: {
      a_label: "workout 30 min or more",
      a_value: "7.0 h",
      b_label: "no workout",
      b_value: "6.5 h",
      n_a: 561,
      n_b: 642,
      window: "Jul 2022 to May 2026",
    },
    caveat:
      "I train more on weekends, when I also sleep in, so this mixes two effects.",
  },
  {
    id: "mindful-deep-sleep",
    title: "Mindfulness days show a little more deep sleep",
    finding:
      "Nights after 10 or more mindful minutes had slightly more deep sleep, but the gap is small.",
    numbers: {
      a_label: "10 min or more",
      a_value: "1.2 h deep",
      b_label: "none logged",
      b_value: "1.0 h deep",
      n_a: 96,
      n_b: 703,
      window: "Sep 2023 to May 2026",
    },
    caveat:
      "Sleep stages from a wrist device are estimates, and the sample of mindful days is small.",
  },
];

const meta = {
  range: { from: FROM, to: TO },
  days: daily.length,
  nights: daily.filter((d) => d.sleep_h !== null).length,
  workout_days: daily.filter((d) => d.workout_min > 0).length,
  tagline: "Four years of my own health data, one experiment at a time.",
  sources: ["Apple Watch", "Unstrap", "Strava", "Nike Run Club"],
  built: "2026-10-26",
  repo: "https://github.com/snakezilla/nof1",
};

// daily rows only feed the meta counts; the page no longer reads daily.json or test.json.
const files = {
  "patterns.json": patterns,
  "meta.json": meta,
};
const write = (dir, name, data) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), JSON.stringify(data, null, 1) + "\n");
};
Object.entries(files).forEach(([name, data]) => {
  write(join(root, "src/fixtures"), name, data);
  process.stdout.write(`wrote src/fixtures/${name}\n`);
});
