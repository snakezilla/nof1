import type { Claim } from "../../lib/figure-types";
import { verdictTone } from "../../lib/figures";
import { cleanNumbers } from "../../lib/numbers";
import { findingAnchor } from "../Finding";

const COLUMNS = [
  "Claim",
  "Figures",
  "Nights",
  "Difference",
  "95% interval",
  "Verdict",
] as const;

function Row({ claim }: { claim: Claim }) {
  const tone = verdictTone(claim.verdict);
  return (
    <tr>
      <th scope="row" data-label={COLUMNS[0]}>
        <a href={`#${findingAnchor(claim.id)}`}>{claim.claim}</a>
      </th>
      <td data-label={COLUMNS[1]} className="num">
        {cleanNumbers(claim.a)} vs {cleanNumbers(claim.b)}
      </td>
      <td data-label={COLUMNS[2]} className="num">
        {claim.n}
      </td>
      <td data-label={COLUMNS[3]} className="num">
        {cleanNumbers(claim.difference)}
      </td>
      <td data-label={COLUMNS[4]} className="num">
        {cleanNumbers(claim.interval)}
      </td>
      <td data-label={COLUMNS[5]}>
        <span className={`verdict is-${tone}`}>{claim.verdict}</span>
      </td>
    </tr>
  );
}

/** F6: every claim with its numbers and a verdict. A real table, so it reads as one. */
export function ClaimsTable({ claims }: { claims: readonly Claim[] }) {
  return (
    <table className="claims">
      <caption className="visually-hidden">
        Every claim on this page, with its figures, the nights behind them, the
        difference, the 95% interval and the verdict.
      </caption>
      <thead>
        <tr>
          {COLUMNS.map((c, i) => (
            <th key={c} scope="col" className={i > 0 && i < 5 ? "num" : ""}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {claims.map((c) => (
          <Row key={c.id} claim={c} />
        ))}
      </tbody>
    </table>
  );
}
