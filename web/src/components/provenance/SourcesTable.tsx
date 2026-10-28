import { sourceRows } from "../../lib/provenance-text";
import type { Provenance } from "../../lib/types";

const COLUMNS = [
  "App",
  "Wrote into Apple Health",
  "In the window",
  "How it got out",
] as const;

/** One row per app that wrote into Apple Health, then the exporter that reads them all. */
export function SourcesTable({ provenance }: { provenance: Provenance }) {
  const rows = sourceRows(provenance);
  return (
    <table className="sources">
      <caption className="visually-hidden">
        Every app that wrote records into Apple Health inside the window, what
        it wrote, how many, and how it got out.
      </caption>
      <thead>
        <tr>
          {COLUMNS.map((c, i) => (
            <th key={c} scope="col" className={i === 2 ? "num" : ""}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.app} className={i === rows.length - 1 ? "is-mine" : ""}>
            <th scope="row" data-label={COLUMNS[0]}>
              {r.app}
            </th>
            <td data-label={COLUMNS[1]}>{r.wrote}</td>
            <td data-label={COLUMNS[2]} className="num">
              {r.count}
            </td>
            <td data-label={COLUMNS[3]}>{r.how}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
