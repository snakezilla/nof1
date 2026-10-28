import {
  GROUP_KEYS,
  type Bedtime,
  type BedtimeGroup,
  type Calendar,
  type CalendarCell,
  type Claim,
  type Figures,
  type MonthRow,
  type SleepGroup,
  type Stat,
  type TypicalNight,
} from "./figure-types";
import { DataShapeError } from "./validate";

type Rec = Record<string, unknown>;

const isObj = (v: unknown): v is Rec =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isNumOrNull = (v: unknown): boolean => v === null || isNum(v);
const isNumArr = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every(isNum);
const arrayOf =
  <T>(check: (x: unknown) => x is T) =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(check);
const strings = (v: Rec, keys: readonly string[]): boolean =>
  keys.every((k) => isStr(v[k]));
const numbers = (v: Rec, keys: readonly string[]): boolean =>
  keys.every((k) => isNum(v[k]));

const isStat = (v: unknown): v is Stat =>
  isObj(v) && strings(v, ["value", "label"]);

const isCell = (v: unknown): v is CalendarCell =>
  isObj(v) &&
  isStr(v.date) &&
  numbers(v, ["week", "weekday", "workout_min"]) &&
  (v.weekday as number) >= 0 &&
  (v.weekday as number) <= 6 &&
  ["sleep_h", "bed_h", "awake_min"].every((k) => isNumOrNull(v[k]));

const isCalendar = (v: unknown): v is Calendar =>
  isObj(v) &&
  isStr(v.start) &&
  isNum(v.weeks) &&
  arrayOf(isCell)(v.cells) &&
  arrayOf((m): m is Rec => isObj(m) && isNum(m.week) && isStr(m.label))(
    v.months,
  );

const isGroup = (v: unknown): v is SleepGroup =>
  isObj(v) &&
  isStr(v.label) &&
  numbers(v, ["n", "mean", "median", "under_6"]) &&
  isNumArr(v.values);

const isPair = (v: unknown): boolean =>
  Array.isArray(v) && v.length === 2 && v.every(isGroup);

const isBedGroup = (v: unknown): v is BedtimeGroup =>
  isObj(v) && isNumArr(v.values) && numbers(v, ["median", "n"]);

const isBedtime = (v: unknown): v is Bedtime =>
  isObj(v) &&
  isBedGroup(v.weekend) &&
  isBedGroup(v.weekday) &&
  numbers(v, ["after_1am", "before_midnight", "n"]);

const isTypical = (v: unknown): v is TypicalNight =>
  isObj(v) && numbers(v, ["bed_h", "sleep_h", "awake_min", "wake_h", "n"]);

const isMonth = (v: unknown): v is MonthRow =>
  isObj(v) &&
  strings(v, ["month", "label"]) &&
  numbers(v, ["nights", "training_days"]) &&
  isNumOrNull(v.median_sleep) &&
  isObj(v.training_min) &&
  Object.values(v.training_min).every(isNum);

const isClaim = (v: unknown): v is Claim =>
  isObj(v) &&
  strings(v, [
    "id",
    "claim",
    "a",
    "b",
    "n",
    "difference",
    "interval",
    "verdict",
  ]);

/** Names the first part of figures.json that is wrong, or null when it is all right. */
const firstProblem = (v: unknown): string | null => {
  if (!isObj(v)) return "expected an object";
  if (!arrayOf(isStat)(v.stats)) return "stats";
  if (!isCalendar(v.calendar)) return "calendar";
  if (!isObj(v.sleep_groups)) return "sleep_groups";
  const groups = v.sleep_groups;
  const badGroup = GROUP_KEYS.find((k) => !isPair(groups[k]));
  if (badGroup) return `sleep_groups.${badGroup}`;
  if (!isBedtime(v.bedtime)) return "bedtime";
  if (!isTypical(v.typical_night)) return "typical_night";
  if (!arrayOf(isMonth)(v.months)) return "months";
  if (!arrayOf(isClaim)(v.claims)) return "claims";
  return null;
};

export const parseFigures = (v: unknown): Figures => {
  const problem = firstProblem(v);
  if (problem)
    throw new DataShapeError(
      "figures.json",
      problem === "expected an object"
        ? problem
        : `${problem} does not match the schema`,
    );
  return v as Figures;
};

/** The page renders without the figures: a missing or wrong file becomes null. */
export const parseFiguresOrNull = (v: unknown): Figures | null => {
  if (v === undefined || v === null) return null;
  try {
    return parseFigures(v);
  } catch {
    return null;
  }
};
