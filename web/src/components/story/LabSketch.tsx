import {
  COLUMN,
  LOOP_LABEL,
  ROW,
  SKETCH_LABEL,
  arrowHead,
  markerBox,
  type Sketch,
} from "../../lib/lab-sketch";

function Drawing({ sketch, className }: { sketch: Sketch; className: string }) {
  const { width, height, boxes, arrows, loop, loopLabel } = sketch;
  return (
    <svg
      className={`sketch__svg ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      {boxes.map((b) => (
        <g className="sketch__box" key={b.name}>
          <path d={markerBox(b)} />
          <text
            className="sketch__name"
            x={b.x + b.w / 2}
            y={b.y + b.h / 2 - 4}
            textAnchor="middle"
          >
            {b.name}
          </text>
          <text
            className="sketch__note"
            x={b.x + b.w / 2}
            y={b.y + b.h / 2 + 20}
            textAnchor="middle"
          >
            {b.note}
          </text>
        </g>
      ))}
      {arrows.map(([x1, y1, x2, y2]) => (
        <path
          className="sketch__arrow"
          key={`${x1}-${y1}`}
          d={`M ${x1} ${y1} L ${x2} ${y2} ${arrowHead(x2, y2, x2 > x1 ? 0 : 90)}`}
        />
      ))}
      <path
        className="sketch__loop"
        d={`${loop.d} ${arrowHead(loop.tip[0], loop.tip[1], loop.angle)}`}
      />
      <text
        className="sketch__note"
        x={loopLabel.x}
        y={loopLabel.y}
        textAnchor={loopLabel.anchor}
      >
        {LOOP_LABEL}
      </text>
    </svg>
  );
}

/** The lab chapter's one picture: the byahsan.com box sketch, in the page's own ink. */
export function LabSketch() {
  return (
    <figure className="sketch">
      <div className="sketch__drawing" role="img" aria-label={SKETCH_LABEL}>
        <Drawing sketch={COLUMN} className="is-column" />
        <Drawing sketch={ROW} className="is-row" />
      </div>
      <figcaption>Redrawn from my sketch on byahsan.com</figcaption>
    </figure>
  );
}
