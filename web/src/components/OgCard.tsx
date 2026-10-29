import { splitLine } from "../lib/projects";
import { HERO, chapterLinks } from "../lib/story";
import type { Dataset } from "../lib/types";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..600&family=Inter:wght@400;500&display=swap";

// The card is a separate document, so it carries the light tokens itself.
const CSS = `
:root { --bg: #F5F1E8; --text: #1a1a1a; --muted: #5f5953; --rule: #d4cfc6; --accent: #c4653a; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; background: var(--bg); color: var(--text); }
body { display: flex; flex-direction: column; justify-content: space-between; padding: 64px 80px; font-family: Inter, Arial, sans-serif; }
.mark { font: 500 28px/1 Inter, Arial, sans-serif; letter-spacing: -0.01em; }
h1 { font-family: Fraunces, Georgia, serif; font-weight: 400; font-size: 84px; line-height: 1.0; letter-spacing: -0.03em; font-optical-sizing: auto; max-width: 18ch; }
h1 span { color: var(--accent); }
.meta { font: 17px/1.5 "SF Mono", Menlo, Consolas, monospace; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 24px; display: flex; gap: 0 32px; flex-wrap: wrap; }
`;

export function OgCard({ data }: { data: Dataset }) {
  const [before, em, after] = splitLine(HERO);
  const items = [
    ...chapterLinks(data.projects).map((c) => c.label),
    ...(data.mask ? ["health values masked"] : []),
  ];
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>nof1 card</title>
        <link rel="stylesheet" href={FONTS} />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        <p className="mark">nof1</p>
        <h1>
          {before}
          <span>{em}</span>
          {after}
        </h1>
        <p className="meta">
          {items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
      </body>
    </html>
  );
}
