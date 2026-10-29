/** projects.json: the other things I'm building, hand-curated from byahsan.com. */
export interface ProjectItem {
  readonly id: string;
  /** Set while an item is not confirmed. An item with a todo never renders. */
  readonly todo?: string;
  readonly line: string;
  /** One phrase inside `line`, set in the accent. */
  readonly emphasis: string;
  readonly sub: string;
  /** Absent only on an item shown with its sub-line instead of a link. */
  readonly href?: string;
  /** Set on the items shown large, after WakeLight; the rest follow as a quiet list. */
  readonly lead?: true;
}

export interface Projects {
  readonly items: readonly ProjectItem[];
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

const isShown = (v: Rec): boolean =>
  isFilled(v.line) &&
  isFilled(v.emphasis) &&
  v.line.includes(v.emphasis) &&
  isFilled(v.sub) &&
  /* No link is allowed only because the sub-line is then shown in its place. */
  (v.href === undefined || isOurLink(v.href)) &&
  ![v.line, v.sub].some(breaksCopyRules);

const isItem = (v: unknown): v is ProjectItem =>
  isObj(v) &&
  isFilled(v.id) &&
  (v.lead === undefined || v.lead === true) &&
  (v.todo === undefined
    ? isShown(v)
    : isFilled(v.todo) &&
      ["line", "emphasis", "sub", "href"].every((k) => isStr(v[k])));

export const isProjects = (v: unknown): v is Projects =>
  isObj(v) &&
  Array.isArray(v.items) &&
  v.items.every(isItem) &&
  new Set(v.items.map((i: ProjectItem) => i.id)).size === v.items.length &&
  isObj(v.more) &&
  isFilled(v.more.text) &&
  !breaksCopyRules(v.more.text) &&
  isOurLink(v.more.href);

/** A missing or wrong projects.json drops the aside; the build refuses a wrong one. */
export const parseProjectsOrNull = (v: unknown): Projects | null =>
  isProjects(v) ? v : null;

/** Only confirmed items reach the page. */
export const shownItems = (p: Projects): readonly ProjectItem[] =>
  p.items.filter((i) => i.todo === undefined);

/** "A cancer diagnostics lab" -> ["A ", "cancer diagnostics", " lab"]. */
export const splitLine = (
  item: Pick<ProjectItem, "line" | "emphasis">,
): readonly [string, string, string] => {
  const at = item.line.indexOf(item.emphasis);
  return [
    item.line.slice(0, at),
    item.emphasis,
    item.line.slice(at + item.emphasis.length),
  ];
};
