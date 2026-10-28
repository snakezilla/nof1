import {
  MASK_ID,
  maskParagraphs,
  rangeLines,
  type MaskInfo,
} from "../../lib/mask";

/** How the masking works, rendered from mask.json. Renders nothing without it. */
export function MaskSection({ mask }: { mask: MaskInfo | null }) {
  if (!mask) return null;
  const [method, real, seed] = maskParagraphs(mask);
  return (
    <section className="section" id={MASK_ID} aria-labelledby="mask-title">
      <h2 className="section__title" id="mask-title">
        How the masking works
      </h2>
      <p className="mask__para">{method}</p>
      <ul className="mask__ranges">
        {rangeLines(mask).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mask__para">{real}</p>
      <p className="mask__para">{seed}</p>
    </section>
  );
}
