import type { Claim } from "../../lib/figure-types";
import { verdictTone } from "../../lib/figures";
import { heroParts, heroText } from "../../lib/text";
import type { Pattern } from "../../lib/types";

/** "Weekends cost me 24 minutes of sleep": the first claim carries its number, from the data. */
const claimFor = (
  p: Pattern,
  i: number,
  patterns: readonly Pattern[],
): string => {
  const parts = i === 0 ? heroParts(patterns) : null;
  return (parts ? heroText(parts) : p.title).replace(/[.]$/, "");
};

/** What the joined year showed: one short line per finding, the claim and its verdict word. */
export function Results({
  patterns,
  claims,
}: {
  patterns: readonly Pattern[];
  claims?: readonly Claim[];
}) {
  return (
    <ul className="results" aria-label="What the joined year showed">
      {patterns.map((p, i) => {
        const verdict = claims?.find((c) => c.id === p.id)?.verdict;
        return (
          <li className="results__item" key={p.id}>
            <span className="results__claim">{claimFor(p, i, patterns)}</span>
            {verdict && (
              <span className={`verdict is-${verdictTone(verdict)}`}>
                {verdict}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
