import type {
  Exclusion,
  Fusion,
  HealthSource,
  Meta,
  Pattern,
  Provenance,
} from "./types";

type Rec = Record<string, unknown>;

const isObj = (v: unknown): v is Rec =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isStrArr = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(isStr);
const optNum = (v: unknown): boolean => v === undefined || isNum(v);
const optStr = (v: unknown): boolean => v === undefined || isStr(v);
const isIsoDate = (v: unknown): v is string =>
  isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

export class DataShapeError extends Error {
  constructor(file: string, detail: string) {
    super(`${file}: ${detail}`);
    this.name = "DataShapeError";
  }
}

export const isPattern = (v: unknown): v is Pattern =>
  isObj(v) &&
  isStr(v.id) &&
  isStr(v.title) &&
  isStr(v.finding) &&
  isStr(v.caveat) &&
  isObj(v.numbers) &&
  ["a_label", "a_value", "b_label", "b_value", "window"].every((k) =>
    isStr((v.numbers as Rec)[k]),
  ) &&
  isNum(v.numbers.n_a) &&
  isNum(v.numbers.n_b) &&
  optStr(v.numbers.diff) &&
  optStr(v.numbers.ci95);

const isCountMap = (v: unknown): v is Record<string, number> =>
  isObj(v) && Object.values(v).every((n) => isNum(n) && n >= 0);

export const isExclusion = (v: unknown): v is Exclusion =>
  isObj(v) && isStr(v.what) && isNum(v.rows) && isStr(v.why);

export const isProvenance = (v: unknown): v is Provenance =>
  isObj(v) &&
  isStr(v.hub) &&
  isStr(v.exporter) &&
  isCountMap(v.nights_by_app) &&
  isCountMap(v.workouts_by_app) &&
  Array.isArray(v.excluded) &&
  v.excluded.every(isExclusion) &&
  isObj(v.window) &&
  isIsoDate(v.window.from) &&
  isIsoDate(v.window.to);

const pick = (v: Rec, keys: readonly string[]): unknown =>
  v[keys.find((k) => v[k] !== undefined) ?? ""];
const dateOf = (v: unknown): string | null =>
  isStr(v) && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;

/** One row of provenance.all_sources, read with the key names prep/ might use. Null when wrong. */
export const toHealthSource = (v: unknown): HealthSource | null => {
  if (!isObj(v)) return null;
  const name = pick(v, ["name", "app", "source"]);
  const types = pick(v, ["types", "record_types", "kinds"]);
  const records = pick(v, ["records", "total", "total_records", "count"]);
  const first = dateOf(pick(v, ["first", "first_date", "from"]));
  const last = dateOf(pick(v, ["last", "last_date", "to"]));
  const inWindow = pick(v, ["in_window", "count_in_window", "window_count"]);
  const status = pick(v, ["status"]);
  const reason = pick(v, ["reason", "why"]);
  const typeList = isStr(types) ? [types] : types;
  if (!isStr(name) || !isStrArr(typeList) || !isNum(records)) return null;
  if (!first || !last || !isStr(status)) return null;
  if (!optNum(inWindow) || !optStr(reason)) return null;
  /* "excluded: HRV is not SDNN" carries its reason after the colon. */
  const [kind, ...why] = status.split(":");
  return {
    name,
    types: typeList,
    records,
    first,
    last,
    in_window: isNum(inWindow) ? inWindow : 0,
    status: kind.trim(),
    reason: isStr(reason) ? reason : why.join(":").trim(),
  };
};

/** All rows or nothing: a half-read list would misstate what is in the store. */
export const parseHealthSources = (
  v: unknown,
): readonly HealthSource[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const rows = v.map(toHealthSource);
  return rows.every((r) => r !== null) ? (rows as HealthSource[]) : undefined;
};

const isCount = (v: unknown): v is number =>
  isNum(v) && Number.isInteger(v) && v >= 0;

export const isFusion = (v: unknown): v is Fusion =>
  isObj(v) &&
  ["raw_lines", "repeats", "records", "dropped_streams", "days"].every((k) =>
    isCount(v[k]),
  ) &&
  (v.repeats as number) <= (v.raw_lines as number);

export const isMeta = (v: unknown): v is Meta =>
  isObj(v) &&
  isObj(v.range) &&
  isIsoDate(v.range.from) &&
  isIsoDate(v.range.to) &&
  isNum(v.days) &&
  optNum(v.days_with_data) &&
  optNum(v.nights) &&
  optNum(v.workout_days) &&
  optStr(v.tagline) &&
  (v.masked === undefined || typeof v.masked === "boolean") &&
  isStrArr(v.sources) &&
  isStr(v.built) &&
  isStr(v.repo);

export const parsePatterns = (v: unknown): readonly Pattern[] => {
  if (!Array.isArray(v))
    throw new DataShapeError("patterns.json", "expected an array");
  const bad = v.findIndex((p) => !isPattern(p));
  if (bad >= 0)
    throw new DataShapeError(
      "patterns.json",
      `item ${bad} does not match the schema`,
    );
  return v as Pattern[];
};

/** A wrong provenance block is dropped, not fatal: the page says so in one sentence. */
export const parseMeta = (v: unknown): Meta => {
  if (!isMeta(v))
    throw new DataShapeError("meta.json", "does not match the schema");
  const { provenance, ...rest } = v;
  if (!isProvenance(provenance)) return rest;
  const { all_sources, fusion, ...base } = provenance as Provenance & {
    fusion?: unknown;
  };
  const sources = parseHealthSources(all_sources);
  return {
    ...rest,
    provenance: {
      ...base,
      ...(sources ? { all_sources: sources } : {}),
      ...(isFusion(fusion) ? { fusion } : {}),
    },
  };
};
