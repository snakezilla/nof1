import type { Dataset } from "./types";
import { DATA_FILES, parseDataset } from "./dataset";

type Fetcher = (url: string) => Promise<Response>;

export const fetchJson = async (
  fetcher: Fetcher,
  url: string,
): Promise<unknown> => {
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new Error(`${url} is not valid JSON`);
  }
};

/** figures.json, raw-stream.json, mask.json and projects.json are optional: when one cannot be read the page renders without it. */
const fetchOptional = (fetcher: Fetcher, url: string): Promise<unknown> =>
  fetchJson(fetcher, url).catch(() => undefined);

export const loadDataset = async (
  fetcher: Fetcher,
  base = "/data",
): Promise<Dataset> => {
  const [figures, rawStream, mask, projects, ...required] = await Promise.all([
    fetchOptional(fetcher, `${base}/figures.json`),
    fetchOptional(fetcher, `${base}/raw-stream.json`),
    fetchOptional(fetcher, `${base}/mask.json`),
    fetchOptional(fetcher, `${base}/projects.json`),
    ...DATA_FILES.map((name) => fetchJson(fetcher, `${base}/${name}.json`)),
  ]);
  const [daily, patterns, test, meta] = required;
  return parseDataset({
    daily,
    patterns,
    test,
    meta,
    figures,
    raw_stream: rawStream,
    mask,
    projects,
  });
};
