import { LH, type EdgeLabel, type Layout } from "../../lib/pipeline-layout";

const PAD = 4;

function Label({ label }: { label: EdgeLabel }) {
  const left =
    label.anchor === "middle"
      ? label.x - label.w / 2
      : label.anchor === "end"
        ? label.x - label.w
        : label.x;
  return (
    <g className="pipe__label">
      {label.knockout && (
        <rect
          className="pipe__knockout"
          x={left - PAD}
          y={label.y - PAD / 2}
          width={label.w + 2 * PAD}
          height={label.lines.length * LH + PAD}
        />
      )}
      {label.lines.map((line, i) => (
        <text
          key={line}
          x={label.x}
          y={label.y + (i + 0.5) * LH}
          textAnchor={label.anchor}
          dominantBaseline="central"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** One drawing of the pipeline at 1:1, so 11 px type stays 11 px. */
export function PipelineSvg({
  layout,
  className,
}: {
  layout: Layout;
  className: string;
}) {
  return (
    <svg
      className={`pipe__svg ${className}`}
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      aria-hidden="true"
      focusable="false"
    >
      {layout.wires.map((w) => (
        <g key={w.key} className={`pipe__wire${w.dashed ? " is-dashed" : ""}`}>
          <polyline points={w.points.map((pt) => pt.join(",")).join(" ")} />
          <path className="pipe__arrow" d={w.arrow} />
        </g>
      ))}
      {layout.wires.map(
        (w) => w.label && <Label key={`${w.key}-label`} label={w.label} />,
      )}
      {layout.boxes.map((b) => (
        <g key={b.id} className={`pipe__node is-${b.kind}`}>
          <path d={b.path} />
          {b.lines.map((line, i) => (
            <text
              key={line}
              x={b.x + b.w / 2}
              y={b.y + b.h / 2 + (i - (b.lines.length - 1) / 2) * LH}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {line}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}
