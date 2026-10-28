import type { Claim, SleepGroups } from "../lib/figure-types";
import { groupForPattern } from "../lib/figures";
import { heroParts, heroText } from "../lib/text";
import type { Pattern } from "../lib/types";
import { Finding } from "./Finding";

/** "Weekends cost me 36 minutes of sleep.": the first title, with its number from the data. */
const firstTitle = (patterns: readonly Pattern[]): string | undefined => {
  const parts = heroParts(patterns);
  return parts ? heroText(parts) : undefined;
};

const pairFor = (id: string, groups?: SleepGroups) => {
  const key = groupForPattern(id);
  return key && groups ? groups[key] : null;
};

const verdictFor = (id: string, claims?: readonly Claim[]): string | null =>
  claims?.find((c) => c.id === id)?.verdict ?? null;

export function Findings({
  patterns,
  groups,
  claims,
}: {
  patterns: readonly Pattern[];
  groups?: SleepGroups;
  claims?: readonly Claim[];
}) {
  return (
    <ol className="findings" aria-label="Findings">
      {patterns.map((p, i) => (
        <Finding
          key={p.id}
          pattern={p}
          pair={pairFor(p.id, groups)}
          verdict={verdictFor(p.id, claims)}
          title={i === 0 ? firstTitle(patterns) : undefined}
        />
      ))}
    </ol>
  );
}
