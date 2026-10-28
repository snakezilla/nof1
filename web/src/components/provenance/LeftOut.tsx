import { leftOutItems, leftOutLine } from "../../lib/provenance-text";
import type { Provenance } from "../../lib/types";

/** What was read and then not used, with the count and the reason. */
export function LeftOut({ provenance }: { provenance: Provenance }) {
  const items = leftOutItems(provenance);
  if (items.length === 0) return null;
  return (
    <div className="prov__block">
      <h3 className="prov__heading">Left out, and why</h3>
      <ul className="left-out">
        {items.map((item) => (
          <li key={item.what}>{leftOutLine(item)}</li>
        ))}
      </ul>
    </div>
  );
}
