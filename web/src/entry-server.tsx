import { StrictMode } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import App from "./App";
import { OgCard } from "./components/OgCard";
import { embedJson, toState, type RawDataset } from "./lib/dataset";
import { isMaskInfo } from "./lib/mask";
import { isProjects } from "./lib/projects";
import { HERO, STORY_SUMMARY } from "./lib/story";
import { isRawStream } from "./lib/raw-stream";
import { parseFigures } from "./lib/validate-figures";

export { embedJson };

/**
 * The page body for dist/index.html. Throws when the data shape is wrong, so the build fails.
 * figures.json, raw-stream.json, mask.json and projects.json may be absent (the page then drops what they
 * feed), but when present they must be right.
 */
export const render = (raw: RawDataset): string => {
  if (raw.figures !== undefined) parseFigures(raw.figures);
  if (raw.raw_stream !== undefined && !isRawStream(raw.raw_stream))
    throw new Error("raw-stream.json does not match the schema");
  if (raw.mask !== undefined && !isMaskInfo(raw.mask))
    throw new Error("mask.json does not match the schema");
  if (raw.projects !== undefined && !isProjects(raw.projects))
    throw new Error("projects.json does not match the schema");
  const state = toState(raw);
  if (state.status !== "ready") throw new Error(state.message);
  return renderToString(
    <StrictMode>
      <App state={state} />
    </StrictMode>,
  );
};

/** The 1200 x 630 social card, as a full HTML document. */
export const renderOg = (raw: RawDataset): string => {
  const state = toState(raw);
  if (state.status !== "ready") throw new Error(state.message);
  return `<!doctype html>${renderToStaticMarkup(<OgCard data={state.data} />)}`;
};

/** The h1 as plain text, for og:title and the og:image alt text. */
export const heroSentence = (raw: RawDataset): string =>
  toState(raw).status === "ready" ? HERO.line : "nof1";

/** The meta description: the h1, then what the page shows, under 160 characters. */
export const description = (raw: RawDataset): string =>
  `${heroSentence(raw)} ${STORY_SUMMARY}`;

/**
 * The public build ships masked values only. Throws unless mask.json says so and meta.json
 * agrees, so a real-data run can never be published by accident.
 */
export const assertMasked = (raw: RawDataset): void => {
  if (!isMaskInfo(raw.mask))
    throw new Error("mask.json is missing or does not say masked: true");
  const meta = raw.meta as { masked?: unknown } | null;
  if (meta?.masked !== true)
    throw new Error("meta.json does not say masked: true");
};
