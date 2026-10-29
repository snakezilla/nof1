/** projects.json: one arc of the other things I'm building, health and tech, in three steps. */
export interface ProjectStep {
  readonly id: string;
  /** The small mono label over the step ("In the lab"). */
  readonly label: string;
  readonly line: string;
  /** One phrase inside `line`, set in the accent. */
  readonly emphasis: string;
  /** Absent on a step with nothing to link to (this page is the "On me" step). */
  readonly href?: string;
  /** One or two short paragraphs under the line. */
  readonly text: readonly string[];
  /** The one step with pictures: the WakeLight clip and render, from src/lib/wakelight.ts. */
  readonly media?: "wakelight";
}

export interface Projects {
  readonly title: string;
  readonly steps: readonly ProjectStep[];
  readonly more: { readonly text: string; readonly href: string };
}

type Rec = Record<string, unknown>;

const isObj = (v: unknown): v is Rec =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isFilled = (v: unknown): v is string => isStr(v) && v.trim() !== "";

export const PROJECTS_ORIGIN = "https://www.byahsan.com";

const isOurLink = (v: unknown): boolean =>
  isStr(v) && (v === PROJECTS_ORIGIN || v.startsWith(`${PROJECTS_ORIGIN}/`));

/** The page's copy rules, plus the public-safety words this aside must never use. */
export const breaksCopyRules = (s: string): boolean =>
  /[—!]/.test(s) || /\b(customers?|pilots?|managexr|luke)\b/i.test(s);

const isText = (v: unknown): v is readonly string[] =>
  Array.isArray(v) &&
  v.length >= 1 &&
  v.length <= 2 &&
  v.every((t) => isFilled(t) && !breaksCopyRules(t));

const isStep = (v: unknown): v is ProjectStep =>
  isObj(v) &&
  isFilled(v.id) &&
  [v.label, v.line, v.emphasis].every(isFilled) &&
  (v.line as string).includes(v.emphasis as string) &&
  ![v.label, v.line].some((s) => breaksCopyRules(s as string)) &&
  (v.href === undefined || isOurLink(v.href)) &&
  isText(v.text) &&
  (v.media === undefined || v.media === "wakelight");

export const isProjects = (v: unknown): v is Projects =>
  isObj(v) &&
  isFilled(v.title) &&
  !breaksCopyRules(v.title) &&
  Array.isArray(v.steps) &&
  v.steps.length > 0 &&
  v.steps.every(isStep) &&
  new Set(v.steps.map((s: ProjectStep) => s.id)).size === v.steps.length &&
  v.steps.filter((s: ProjectStep) => s.media !== undefined).length <= 1 &&
  isObj(v.more) &&
  isFilled(v.more.text) &&
  !breaksCopyRules(v.more.text) &&
  isOurLink(v.more.href);

/** A missing or wrong projects.json drops the aside; the build refuses a wrong one. */
export const parseProjectsOrNull = (v: unknown): Projects | null =>
  isProjects(v) ? v : null;

/** "A cancer diagnostics lab" -> ["A ", "cancer diagnostics", " lab"]. */
export const splitLine = (
  step: Pick<ProjectStep, "line" | "emphasis">,
): readonly [string, string, string] => {
  const at = step.line.indexOf(step.emphasis);
  return [
    step.line.slice(0, at),
    step.emphasis,
    step.line.slice(at + step.emphasis.length),
  ];
};
