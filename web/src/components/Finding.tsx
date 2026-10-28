import type { GroupPair } from "../lib/figure-types";
import { cleanNumbers } from "../lib/numbers";
import type { Pattern } from "../lib/types";
import { SleepStrips } from "./figures/SleepStrips";

export const findingAnchor = (id: string): string => `finding-${id}`;

function Figure({
  value,
  label,
  n,
}: {
  value: string;
  label: string;
  n: number;
}) {
  return (
    <div className="figure">
      <p className="figure__value">{cleanNumbers(value)}</p>
      <p className="figure__label">
        {label},{" "}
        <span className="figure__n">n = {n.toLocaleString("en-US")}</span>
      </p>
    </div>
  );
}

/** "Difference −0.2 h, 95% interval −0.9 to −0.2 h", or null when neither is given. */
export const statsLine = (p: Pattern): string | null => {
  const parts = [
    p.numbers.diff ? `Difference ${cleanNumbers(p.numbers.diff)}` : null,
    p.numbers.ci95 ? `95% interval ${cleanNumbers(p.numbers.ci95)}` : null,
  ].filter((s): s is string => s !== null);
  return parts.length ? parts.join(", ") : null;
};

export function Finding({
  pattern,
  pair,
  title,
}: {
  pattern: Pattern;
  pair?: GroupPair | null;
  /** Replaces the pattern title; the first finding carries its number in the title. */
  title?: string;
}) {
  const x = pattern.numbers;
  const stats = statsLine(pattern);
  return (
    <li className="finding" id={findingAnchor(pattern.id)}>
      <div className="finding__text">
        <h4 className="finding__title">{title ?? pattern.title}</h4>
        <p className="finding__sentence">{cleanNumbers(pattern.finding)}</p>
        {pair && <SleepStrips pair={pair} />}
        <p className="finding__caveat">{cleanNumbers(pattern.caveat)}</p>
      </div>
      <div className="finding__numbers">
        <div className="finding__pair">
          <Figure value={x.a_value} label={x.a_label} n={x.n_a} />
          <Figure value={x.b_value} label={x.b_label} n={x.n_b} />
        </div>
        {stats && <p className="finding__stats">{stats}</p>}
      </div>
    </li>
  );
}
