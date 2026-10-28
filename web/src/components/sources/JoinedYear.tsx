import type { ReactNode } from "react";
import { MaskedContext } from "../../lib/masked";

/** The analysis, demoted under one heading. Inside it every figure kicker says the data is masked. */
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
      <p className="section__intro">
        {masked
          ? "One year of the joined rows, from the masked values. The shapes are what one row per day makes possible; the numbers are not my real ones."
          : "One year of the joined rows."}
      </p>
      <MaskedContext.Provider value={masked}>{children}</MaskedContext.Provider>
    </section>
  );
}
