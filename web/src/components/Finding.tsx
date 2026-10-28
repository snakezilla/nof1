import type { GroupPair } from "../lib/figure-types";
import { verdictTone } from "../lib/figures";
import { cleanNumbers } from "../lib/numbers";
import type { Pattern } from "../lib/types";
import { SleepStrips } from "./figures/SleepStrips";

export const findingAnchor = (id: string): string => `finding-${id}`;

/** "5.9 h vs 6.3 h, difference −0.4 h, 95% interval −0.8 to 0.0 h". */
export const numbersLine = (p: Pattern): string =>
  cleanNumbers(
    [
      `${p.numbers.a_value} vs ${p.numbers.b_value}`,
      p.numbers.diff ? `difference ${p.numbers.diff}` : null,
      p.numbers.ci95 ? `95% interval ${p.numbers.ci95}` : null,
    ]
      .filter((s): s is string => s !== null)
      .join(", "),
  );

export function Finding({
  pattern,
  pair,
  verdict,
  title,
}: {
  pattern: Pattern;
  pair?: GroupPair | null;
  /** "holds", "at the edge" or "not shown", from figures.json. */
  verdict?: string | null;
  /** Replaces the pattern title; the first finding carries its number in the title. */
  title?: string;
}) {
  return (
    <li className="finding" id={findingAnchor(pattern.id)}>
      <h3 className="finding__title">{title ?? pattern.title}</h3>
      {pair && <SleepStrips pair={pair} />}
      <p className="finding__line">
        {numbersLine(pattern)}
        {verdict ? (
          <>
            :{" "}
            <span className={`verdict is-${verdictTone(verdict)}`}>
              {verdict}
            </span>
            .
          </>
        ) : (
          "."
        )}
      </p>
    </li>
  );
}
