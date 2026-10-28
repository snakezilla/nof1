import type { Dataset } from "./types";
import {
  parseDaily,
  parseExperiment,
  parseMeta,
  parsePatterns,
} from "./validate";
import { parseFiguresOrNull } from "./validate-figures";
import { parseRawStreamOrNull } from "./raw-stream";
import { parseMaskOrNull } from "./mask";
import { parseProjectsOrNull } from "./projects";

/** The data files as read from disk or the network, not yet checked. Figures, the raw stream, the mask and the projects are optional. */
export interface RawDataset {
  readonly daily: unknown;
  readonly patterns: unknown;
  readonly test: unknown;
  readonly meta: unknown;
  readonly figures?: unknown;
  readonly raw_stream?: unknown;
  readonly mask?: unknown;
  readonly projects?: unknown;
}

export const DATA_FILES = ["daily", "patterns", "test", "meta"] as const;

export type DataState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly data: Dataset };

export type ParsedState = Exclude<DataState, { readonly status: "loading" }>;

export const parseDataset = (raw: RawDataset): Dataset => ({
  daily: parseDaily(raw.daily),
  patterns: parsePatterns(raw.patterns),
  test: parseExperiment(raw.test),
  meta: parseMeta(raw.meta),
  figures: parseFiguresOrNull(raw.figures),
  rawStream: parseRawStreamOrNull(raw.raw_stream),
  mask: parseMaskOrNull(raw.mask),
  projects: parseProjectsOrNull(raw.projects),
});

/** Never throws: a wrong shape becomes an error state the page can show. */
export const toState = (raw: RawDataset): ParsedState => {
  try {
    return { status: "ready", data: parseDataset(raw) };
  } catch (err: unknown) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "unknown error",
    };
  }
};

/** Reads the data the build embedded in the page. Null when there is none (dev server). */
export const readEmbedded = (doc: Document): ParsedState | null => {
  const node = doc.getElementById("nof1-data");
  if (!node?.textContent) return null;
  try {
    return toState(JSON.parse(node.textContent) as RawDataset);
  } catch {
    return { status: "error", message: "the embedded data is not valid JSON" };
  }
};

/** JSON that is safe inside a script element: no "</script>" can appear in it. */
export const embedJson = (raw: RawDataset): string =>
  JSON.stringify(raw).replace(/</g, "\\u003c");
