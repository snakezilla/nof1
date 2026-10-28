import { numberWord } from "../lib/checkin";
import type { SleepGroups } from "../lib/figure-types";
import { groupForPattern } from "../lib/figures";
import { heroParts, heroText } from "../lib/text";
import type { Pattern } from "../lib/types";
import { Finding } from "./Finding";

export const findingsTitle = (n: number): string => {
  const word = n === 1 ? "One finding" : `${numberWord(n)} findings`;
  return word.charAt(0).toUpperCase() + word.slice(1);
};

/** "Weekends cost me 36 minutes of sleep.": the first title, with its number from the data. */
const firstTitle = (patterns: readonly Pattern[]): string | undefined => {
  const parts = heroParts(patterns);
  return parts ? heroText(parts) : undefined;
};

const pairFor = (id: string, groups?: SleepGroups) => {
  const key = groupForPattern(id);
  return key && groups ? groups[key] : null;
};

export function Findings({
  patterns,
  groups,
}: {
  patterns: readonly Pattern[];
  groups?: SleepGroups;
}) {
  return (
    <section className="section" aria-labelledby="findings-title">
      <h3 className="section__title" id="findings-title">
        {findingsTitle(patterns.length)}
      </h3>
      <ol className="findings">
        {patterns.map((p, i) => (
          <Finding
            key={p.id}
            pattern={p}
            pair={pairFor(p.id, groups)}
            title={i === 0 ? firstTitle(patterns) : undefined}
          />
        ))}
      </ol>
    </section>
  );
}
