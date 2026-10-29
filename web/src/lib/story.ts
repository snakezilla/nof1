import { stepFor, type Projects, type StepId } from "./projects";

/** The page's one idea, with its accent phrase. Lives in code so the page stands without projects.json. */
export const HERO = {
  line: "Health and tech, from the lab to my bedside.",
  emphasis: "Health and tech",
} as const;

export const STORY_DECK =
  "I build tools for a cancer diagnostics lab, for my own health data and for my bedside.";

/** The short form of the page, for the meta description after the h1. */
export const STORY_SUMMARY =
  "A cancer lab that runs itself, my own health data in one row per day, and a sunrise lamp.";

export type ChapterKey = StepId | "me";

/** The n-of-1 chapter: always on the page, so its label lives here, not in projects.json. */
export const ME_LABEL = "On me";

const ORDER: readonly ChapterKey[] = ["lab", "me", "bedside", "next"];

export const chapterId = (key: ChapterKey): string => `chapter-${key}`;

export interface ChapterLink {
  readonly key: ChapterKey;
  readonly label: string;
}

/** The chapters on the page, in order, for the index under the hero. */
export const chapterLinks = (
  projects: Projects | null,
): readonly ChapterLink[] =>
  ORDER.flatMap((key): ChapterLink[] => {
    if (key === "me") return [{ key, label: ME_LABEL }];
    const step = stepFor(projects, key);
    return step ? [{ key, label: step.label }] : [];
  });
