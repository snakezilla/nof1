import { addDays, daysBetween } from "./dates";

export type AnswerValue = number | boolean;
export type Answers = Readonly<Record<string, AnswerValue>>;
export type CheckinStore = Readonly<Record<string, Answers>>;

export const STORAGE_KEY = "nof1.checkin.v1";

const isAnswers = (v: unknown): v is Answers =>
  typeof v === "object" &&
  v !== null &&
  !Array.isArray(v) &&
  Object.values(v).every(
    (x) =>
      typeof x === "boolean" || (typeof x === "number" && Number.isFinite(x)),
  );

export const parseStore = (raw: string | null): CheckinStore => {
  if (!raw) return {};
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
    return Object.fromEntries(
      Object.entries(v).filter(
        ([date, a]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && isAnswers(a),
      ),
    );
  } catch {
    return {};
  }
};

export const loadStore = (
  storage: Pick<Storage, "getItem"> | undefined,
): CheckinStore => {
  try {
    return parseStore(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return {};
  }
};

export const saveStore = (
  storage: Pick<Storage, "setItem"> | undefined,
  store: CheckinStore,
): boolean => {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
};

export const setAnswer = (
  store: CheckinStore,
  date: string,
  id: string,
  value: AnswerValue,
): CheckinStore => ({
  ...store,
  [date]: { ...(store[date] ?? {}), [id]: value },
});

export const answeredDates = (store: CheckinStore): readonly string[] =>
  Object.keys(store)
    .filter((d) => Object.keys(store[d]).length > 0)
    .sort();

export const firstAnswerDate = (store: CheckinStore): string | null =>
  answeredDates(store)[0] ?? null;

/** 1-based day of the experiment, counted from the first stored answer. Null before any answer. */
export const dayNumber = (
  store: CheckinStore,
  today: string,
): number | null => {
  const first = firstAnswerDate(store);
  return first === null ? null : daysBetween(first, today) + 1;
};

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

export const numberWord = (n: number): string => NUMBER_WORDS[n] ?? String(n);

export const dayLabel = (
  store: CheckinStore,
  today: string,
  duration: number,
  questionCount: number,
): string => {
  const n = dayNumber(store, today);
  if (n === null) {
    const what =
      questionCount === 1
        ? "today's question"
        : `today's ${numberWord(questionCount)} questions`;
    return `No check-ins yet. Answer ${what} to start.`;
  }
  if (n > duration)
    return `Finished. ${answeredDates(store).length} of ${duration} days logged.`;
  return `Day ${n} of ${duration}. Saved on this device.`;
};

export interface StripDot {
  readonly date: string;
  readonly filled: boolean;
  readonly today: boolean;
}

export const strip = (
  store: CheckinStore,
  today: string,
  duration: number,
): readonly StripDot[] => {
  const start = firstAnswerDate(store) ?? today;
  const done = new Set(answeredDates(store));
  return Array.from({ length: duration }, (_, i) => {
    const date = addDays(start, i);
    return { date, filled: done.has(date), today: date === today };
  });
};
