import { otherSourceRows } from "../../lib/provenance-text";
import type { Provenance } from "../../lib/types";

const COLUMNS = ["App", "What it wrote", "Records", "Dates", "Why not here"];

/** Every other app in the Health store. Renders nothing until prep/ writes all_sources. */
export function OtherSources({
  provenance,
  mindfulDays,
}: {
  provenance: Provenance;
  mindfulDays: number | null;
}) {
  const rows = otherSourceRows(provenance, mindfulDays);
  if (!rows || rows.length === 0) return null;
  return (
    <div className="prov__block">
      <h3 className="prov__heading" id="other-sources-title">
        Everything else in my Health store
      </h3>
      <table
        className="sources sources--other"
        aria-labelledby="other-sources-title"
      >
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c} scope="col" className={c === "Records" ? "num" : ""}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.app}-${r.dates}`}>
              <th scope="row">{r.app}</th>
              <td data-label={COLUMNS[1]}>{r.wrote}</td>
              <td data-label={COLUMNS[2]} className="num">
                {r.records}
                <span className="sources__merged">{r.dates}</span>
              </td>
              <td data-label={COLUMNS[3]} className="sources__dates">
                {r.dates}
              </td>
              <td data-label={COLUMNS[4]}>{r.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
