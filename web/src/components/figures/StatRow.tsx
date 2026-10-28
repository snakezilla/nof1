import type { Stat } from "../../lib/figure-types";

/** Four counts, each number over its small caption. */
export function StatRow({
  stats,
  label,
}: {
  stats: readonly Stat[];
  label: string;
}) {
  return (
    <ul className="stats" aria-label={label}>
      {stats.map((s) => (
        <li key={s.label} className="stat">
          <span className="stat__value">{s.value}</span>
          <span className="stat__label">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}
