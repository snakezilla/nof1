import type { ReactNode } from "react";

interface Props {
  /** Short name of the drawing for assistive tech. */
  label: string;
  /** One sentence with the key numbers, read in place of the drawing. */
  summary: string;
  legend?: ReactNode;
  caption?: string;
  className?: string;
  children: ReactNode;
}

/** Drawing, legend, caption: the frame every figure shares. */
export function FigureFrame({
  label,
  summary,
  legend,
  caption,
  className,
  children,
}: Props) {
  return (
    <figure className={`fig${className ? ` ${className}` : ""}`}>
      <div className="fig__drawing" role="img" aria-label={label}>
        {children}
      </div>
      <p className="visually-hidden">{summary}</p>
      {legend && (
        <p className="fig__legend" aria-hidden="true">
          {legend}
        </p>
      )}
      {caption && <figcaption className="fig__caption">{caption}</figcaption>}
    </figure>
  );
}

/** One legend entry: a small swatch and its words. */
export function Key({
  swatch,
  opacity,
  children,
}: {
  swatch: string;
  /** The same opacity the marks use, so the key matches the drawing. */
  opacity?: number;
  children: ReactNode;
}) {
  return (
    <span className="key">
      <span className={`key__swatch ${swatch}`} style={{ opacity }} />
      {children}
    </span>
  );
}
