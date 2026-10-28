import { MASK_ID, maskParagraphs, type MaskInfo } from "../../lib/mask";

/** How the masking works, two sentences from mask.json. Renders nothing without it. */
export function MaskSection({ mask }: { mask: MaskInfo | null }) {
  if (!mask) return null;
  return (
    <section className="section" id={MASK_ID} aria-labelledby="mask-title">
      <h2 className="section__title" id="mask-title">
        How the masking works
      </h2>
      <p className="mask__para">{maskParagraphs(mask).join(" ")}</p>
    </section>
  );
}
