import { useMemo } from "react";
import { formatDateLong } from "../lib/dates";
import { recentWindow } from "../lib/days";
import { WINDOW_NIGHTS, nightRows, windowNightCount } from "../lib/nights";
import { sleepLine } from "../lib/sleepline";
import type { MonthRow } from "../lib/figure-types";
import type { Day } from "../lib/types";
import { MonthRows } from "./figures/MonthRows";
import { NightsTable } from "./NightsTable";
import { SleepLineFigure } from "./SleepLineFigure";

export function Nights({
  days,
  months,
}: {
  days: readonly Day[];
  months?: readonly MonthRow[];
}) {
  const model = useMemo(
    () => ({
      rows: nightRows(days, WINDOW_NIGHTS),
      total: windowNightCount(days, WINDOW_NIGHTS),
      line: sleepLine(days, WINDOW_NIGHTS),
      win: recentWindow(days, WINDOW_NIGHTS),
    }),
    [days],
  );

  return (
    <section className="section" aria-labelledby="nights-title">
      <h3 className="section__title" id="nights-title">
        The nights
      </h3>
      {months && months.length > 0 && <MonthRows months={months} />}
      {model.win && model.line ? (
        <>
          <p className="section__intro">
            The last {model.total} nights of the data, to{" "}
            {formatDateLong(model.win.to)}, newest first. An empty cell means no
            reading.
          </p>
          <SleepLineFigure line={model.line} />
          <NightsTable rows={model.rows} total={model.total} />
        </>
      ) : (
        <p className="section__intro">No nights with sleep data yet.</p>
      )}
    </section>
  );
}
