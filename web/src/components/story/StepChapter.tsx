import { LAB_DIAGRAM, LAB_LABEL, LAB_SUMMARY } from "../../lib/lab-figure";
import { splitLine, type ProjectStep } from "../../lib/projects";
import {
  WAKE_DIAGRAM,
  WAKE_LABEL,
  WAKE_SUMMARY,
} from "../../lib/wake-timeline";
import { WakeLightMedia } from "../WakeLight";
import { Chapter } from "./Chapter";
import { DiagramFigure } from "./Diagram";

/** A chapter from projects.json: its line as the h2 (a link when it has one), its diagram, the text, any pictures. */
export function StepChapter({ step }: { step?: ProjectStep }) {
  if (!step) return null;
  const [before, em, after] = splitLine(step);
  const line = (
    <>
      {before}
      <span className="chapter__em">{em}</span>
      {after}
    </>
  );
  return (
    <Chapter
      chapter={step.id}
      label={step.label}
      title={step.href ? <a href={step.href}>{line}</a> : line}
    >
      {step.media === "lab" && (
        <DiagramFigure
          name="lab"
          diagram={LAB_DIAGRAM}
          label={LAB_LABEL}
          summary={LAB_SUMMARY}
        />
      )}
      {step.media === "wakelight" && (
        <DiagramFigure
          name="wake"
          diagram={WAKE_DIAGRAM}
          label={WAKE_LABEL}
          summary={WAKE_SUMMARY}
        />
      )}
      <div className="chapter__body">
        {step.text.map((t) => (
          <p className="chapter__text" key={t}>
            {t}
          </p>
        ))}
        {step.media === "wakelight" && <WakeLightMedia />}
      </div>
    </Chapter>
  );
}
