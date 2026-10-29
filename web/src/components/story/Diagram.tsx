import {
  arrowHead,
  boxTexts,
  markerBox,
  type Diagram,
  type Scene,
  type SceneText,
} from "../../lib/scene";
import { FigureFrame } from "../figures/FigureFrame";

function Words({ t }: { t: SceneText }) {
  return (
    <text
      className={`scene__${t.kind}`}
      x={t.x}
      y={t.y}
      textAnchor={t.anchor ?? "start"}
    >
      {t.text}
    </text>
  );
}

/** One scene at 1:1, in the page's tokens: CSS colours every stroke and word. */
function SceneSvg({ scene, className }: { scene: Scene; className: string }) {
  const { width, height, boxes, lines, texts, dots } = scene;
  return (
    <svg
      className={`scene ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <path
          className={`scene__${l.kind} is-${l.tone}`}
          key={`l${i}`}
          d={l.head ? `${l.d} ${arrowHead(...l.head)}` : l.d}
        />
      ))}
      {boxes.map((b) => (
        <g key={b.name}>
          <path className={`scene__box is-${b.tone}`} d={markerBox(b)} />
          {boxTexts(b).map((t) => (
            <Words t={t} key={t.text} />
          ))}
        </g>
      ))}
      {dots.map((d) => (
        <circle
          className={`scene__dot is-${d.tone}`}
          key={`${d.x}-${d.y}`}
          cx={d.x}
          cy={d.y}
          r={4.5}
        />
      ))}
      {texts.map((t) => (
        <Words t={t} key={`${t.x}-${t.y}-${t.text}`} />
      ))}
    </svg>
  );
}

/** A chapter's one diagram: a column for phones, a row from 48rem, one label and one hidden summary. */
export function DiagramFigure({
  diagram,
  label,
  summary,
  name,
}: {
  diagram: Diagram;
  label: string;
  summary: string;
  /** "lab", "funnel" or "wake", for the figure's class. */
  name: string;
}) {
  return (
    <FigureFrame
      label={label}
      summary={summary}
      className={`diagram diagram--${name}`}
    >
      <SceneSvg scene={diagram.column} className="is-column" />
      <SceneSvg scene={diagram.row} className="is-row" />
    </FigureFrame>
  );
}
