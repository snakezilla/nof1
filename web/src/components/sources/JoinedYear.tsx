import type { ReactNode } from "react";
import { MASKED_LABEL } from "../../lib/mask";

/** The analysis under one heading. The mask is said once, here, not on every figure. */
export function JoinedYear({
  masked,
  children,
}: {
  masked: boolean;
  children: ReactNode;
}) {
  return (
    <section className="section part" aria-labelledby="joined-title">
      <h2 className="part__title" id="joined-title">
        What a joined year looks like
      </h2>
      {masked && <p className="part__mask">{MASKED_LABEL}</p>}
      {children}
    </section>
  );
}
