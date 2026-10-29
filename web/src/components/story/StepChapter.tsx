import type { ReactNode } from "react";
import { splitLine, type ProjectStep } from "../../lib/projects";
import { WakeLightMedia } from "../WakeLight";
import { LabSketch } from "./LabSketch";
import { Chapter } from "./Chapter";

/** A chapter from projects.json: its line as the h2 (a link when it has one), any pictures, the text. */
export function StepChapter({
  step,
  children,
}: {
  step?: ProjectStep;
  children?: ReactNode;
}) {
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
      {step.media === "lab-sketch" && <LabSketch />}
      {step.media === "wakelight" && <WakeLightMedia />}
      {step.text.map((t) => (
        <p className="chapter__text" key={t}>
          {t}
        </p>
      ))}
      {children}
    </Chapter>
  );
}
