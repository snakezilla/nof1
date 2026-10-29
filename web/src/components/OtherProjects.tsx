import { shownItems, splitLine, type Projects } from "../lib/projects";
import { WakeLight } from "./WakeLight";

/**
 * An aside of the other things I'm building, one linked line each, from projects.json. An item
 * with no link shows its sub-line instead, and a quiet line after it marks the way back. Renders
 * nothing without the file. WakeLight follows the list, the one item shown with pictures.
 */
export function OtherProjects({ projects }: { projects: Projects | null }) {
  const items = projects ? shownItems(projects) : [];
  if (!projects || items.length === 0) return null;
  return (
    <>
      <aside className="elsewhere" aria-labelledby="elsewhere-title">
        <h3 className="elsewhere__title" id="elsewhere-title">
          Other things I'm building
        </h3>
        <ul className="elsewhere__list">
          {items.map((item) => {
            const [before, em, after] = splitLine(item);
            const line = (
              <>
                {before}
                <span className="elsewhere__em">{em}</span>
                {after}
              </>
            );
            return (
              <li className="elsewhere__item" key={item.id}>
                {item.href ? (
                  <a className="elsewhere__line" href={item.href}>
                    {line}
                  </a>
                ) : (
                  <>
                    <p className="elsewhere__line">{line}</p>
                    <p className="elsewhere__sub">{item.sub}</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <WakeLight />
        <p className="elsewhere__more">
          <a href={projects.more.href}>{projects.more.text}</a>
        </p>
      </aside>
      <p className="elsewhere__return">Back to the n-of-1 project</p>
    </>
  );
}
