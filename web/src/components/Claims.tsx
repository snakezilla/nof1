import type { Claim } from "../lib/figure-types";
import { ClaimsTable } from "./figures/ClaimsTable";

export function Claims({ claims }: { claims: readonly Claim[] }) {
  return (
    <section className="section" aria-labelledby="claims-title">
      <h3 className="section__title" id="claims-title">
        Every claim, scored
      </h3>
      <p className="section__intro">
        A claim holds when its whole 95% interval sits below zero. At the edge
        means the interval reaches zero, so the effect could be nothing. Not
        shown means it crosses zero.
      </p>
      <ClaimsTable claims={claims} />
    </section>
  );
}
