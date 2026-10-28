import { howParagraphs } from "../../lib/provenance-text";
import type { Provenance } from "../../lib/types";

export function HowIGotIt({ provenance }: { provenance: Provenance }) {
  return (
    <div className="prov__block">
      <h3 className="prov__heading">Why through Apple Health</h3>
      {howParagraphs(provenance).map((p) => (
        <p key={p.slice(0, 32)} className="prov__para">
          {p}
        </p>
      ))}
    </div>
  );
}
