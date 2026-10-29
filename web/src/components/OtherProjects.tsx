import { splitLine, type ProjectStep, type Projects } from "../lib/projects";
import { WakeLightMedia } from "./WakeLight";

/** The step's Fraunces line with its phrase in the accent; a link when the step has one. */
function Line({ step, id }: { step: ProjectStep; id: string }) {
  const [before, em, after] = splitLine(step);
  const line = (
    <>
      {before}
      <span className="elsewhere__em">{em}</span>
      {after}
    </>
  );
  return step.href ? (
    <a className="elsewhere__line" id={id} href={step.href}>
      {line}
    </a>
  ) : (
    <p className="elsewhere__line" id={id}>
      {line}
    </p>
  );
}

function Step({ step }: { step: ProjectStep }) {
  const lineId = `step-${step.id}`;
  return (
    <li className="step" aria-labelledby={lineId}>
      <p className="step__label">{step.label}</p>
      <Line step={step} id={lineId} />
      {step.media === "wakelight" && <WakeLightMedia />}
      {step.text.map((t) => (
        <p className="step__text" key={t}>
          {t}
        </p>
      ))}
    </li>
  );
}

/**
 * An aside of the other things I'm building, from projects.json: one arc, health and tech, in
 * three steps from the lab to the bedside. Each step is a mono label, one Fraunces line and a
 * sentence or two; the last one has the WakeLight pictures. A quiet line after the aside marks the
 * way back. Renders nothing without the file.
 */
export function OtherProjects({ projects }: { projects: Projects | null }) {
  if (!projects) return null;
  return (
    <>
      <aside className="elsewhere" aria-labelledby="elsewhere-title">
        <h3 className="elsewhere__title" id="elsewhere-title">
          {projects.title}
        </h3>
        <ol className="elsewhere__steps">
          {projects.steps.map((step) => (
            <Step step={step} key={step.id} />
          ))}
        </ol>
        <p className="elsewhere__more">
          <a href={projects.more.href}>{projects.more.text}</a>
        </p>
      </aside>
      <p className="elsewhere__return">Back to the n-of-1 project</p>
    </>
  );
}
