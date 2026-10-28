import { useState } from "react";
import {
  SHORT_ROWS,
  isHidden,
  toggleLabel,
  type NightRow,
} from "../lib/nights";

interface Props {
  rows: readonly NightRow[];
  total: number;
}

function Row({ row, hidden }: { row: NightRow; hidden: boolean }) {
  const cls = hidden ? "is-extra" : undefined;
  if (row.kind === "gap") {
    return (
      <tr className={["gap", cls].filter(Boolean).join(" ")}>
        <td colSpan={5}>{row.label}</td>
      </tr>
    );
  }
  return (
    <tr className={cls}>
      <th scope="row">
        <time dateTime={row.date}>
          <span className="nights__weekday">{row.weekday}</span> {row.day}
        </time>
      </th>
      <td className="num">{row.sleep}</td>
      <td className="num col-awake">{row.awake}</td>
      <td className="num">{row.bedtime}</td>
      <td>
        {row.training}
        {row.trainingKind && (
          <span className="nights__kind"> {row.trainingKind}</span>
        )}
      </td>
    </tr>
  );
}

export function NightsTable({ rows, total }: Props) {
  const [expanded, setExpanded] = useState(false);
  const canToggle = rows.length > SHORT_ROWS;
  return (
    <>
      <div className="nights__scroll">
        <table className="nights__table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col" className="num">
                Sleep
              </th>
              <th scope="col" className="num col-awake">
                Awake
              </th>
              <th scope="col" className="num">
                Bedtime
              </th>
              <th scope="col">Training</th>
            </tr>
          </thead>
          <tbody id="nights-rows">
            {rows.map((row, i) => (
              <Row
                key={row.kind === "gap" ? `gap-${row.from}` : row.date}
                row={row}
                hidden={isHidden(i, expanded)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {canToggle && (
        <button
          type="button"
          className="button js-only"
          aria-expanded={expanded}
          aria-controls="nights-rows"
          onClick={() => setExpanded((e) => !e)}
        >
          {toggleLabel(expanded, total)}
        </button>
      )}
    </>
  );
}
