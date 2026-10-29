/** projects.json: the chapters around the n-of-1 chapter, in page order. */
export const STEP_IDS = ["lab", "bedside"] as const;
export type StepId = (typeof STEP_IDS)[number];

const MEDIA = ["lab", "wakelight"] as const;
export type Media = (typeof MEDIA)[number];

export interface ProjectStep {
  readonly id: StepId;
  /** The small mono label over the chapter and in the index ("In the lab"). */
  readonly label: string;
  readonly line: string;
  /** One phrase inside `line`, set in the accent. */
  readonly emphasis: string;
  /** Absent on a step with nothing to link to. */
  readonly href?: string;
  /** One or two short paragraphs under the line. */
  readonly text: readonly string[];
  /** The chapter's diagram: the two lab lanes (src/lib/lab-figure.ts), or the wake timeline with the WakeLight clip and render (src/lib/wake-timeline.ts, src/lib/wakelight.ts). */
  readonly media?: Media;
}

export interface Projects {
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

/** The page's copy rules, plus the public-safety words these chapters must never use. */
export const breaksCopyRules = (s: string): boolean =>
  /[—!]/.test(s) || /\b(customers?|pilots?|managexr|luke)\b/i.test(s);

const isText = (v: unknown): v is readonly string[] =>
  Array.isArray(v) &&
  v.length >= 1 &&
  v.length <= 2 &&
  v.every((t) => isFilled(t) && !breaksCopyRules(t));

const isStepId = (v: unknown): v is StepId => STEP_IDS.some((id) => id === v);

const isStep = (v: unknown): v is ProjectStep =>
  isObj(v) &&
  isStepId(v.id) &&
  [v.label, v.line, v.emphasis].every(isFilled) &&
  (v.line as string).includes(v.emphasis as string) &&
  ![v.label, v.line].some((s) => breaksCopyRules(s as string)) &&
  (v.href === undefined || isOurLink(v.href)) &&
  isText(v.text) &&
  (v.media === undefined || MEDIA.some((m) => m === v.media));

/** Each picture belongs to one chapter at most. */
const oncePerMedia = (steps: readonly ProjectStep[]): boolean =>
  MEDIA.every((m) => steps.filter((s) => s.media === m).length <= 1);

export const isProjects = (v: unknown): v is Projects =>
  isObj(v) &&
  Array.isArray(v.steps) &&
  v.steps.length > 0 &&
  v.steps.every(isStep) &&
  new Set(v.steps.map((s: ProjectStep) => s.id)).size === v.steps.length &&
  oncePerMedia(v.steps) &&
  isObj(v.more) &&
  isFilled(v.more.text) &&
  !breaksCopyRules(v.more.text) &&
  isOurLink(v.more.href);

/** A missing or wrong projects.json drops its chapters; the build refuses a wrong one. */
export const parseProjectsOrNull = (v: unknown): Projects | null =>
  isProjects(v) ? v : null;

export const stepFor = (
  projects: Projects | null,
  id: StepId,
): ProjectStep | undefined => projects?.steps.find((s) => s.id === id);

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
