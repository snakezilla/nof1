import { shownItems, splitLine, type ProjectItem, type Projects } from "../lib/projects";
import { WakeLight } from "./WakeLight";

/** One item's line, with its phrase in the accent only when the line is set large. */
function Line({ item, accent }: { item: ProjectItem; accent: boolean }) {
  const [before, em, after] = splitLine(item);
  const line = accent ? (
    <>
      {before}
      <span className="elsewhere__em">{em}</span>
      {after}
    </>
  ) : (
    item.line
  );
  const cls = accent ? "elsewhere__line" : "elsewhere__small";
  return item.href ? (
    <a className={cls} href={item.href}>
      {line}
    </a>
  ) : (
    <>
      <p className={cls}>{line}</p>
      <p className="elsewhere__sub">{item.sub}</p>
    </>
  );
}

/**
 * An aside of the other things I'm building, from projects.json. Three items are set large:
 * WakeLight (the one with pictures), then the items marked `lead`. The rest follow as a quiet list
 * of small lines. An item with no link shows its sub-line instead, and a quiet line after the aside
 * marks the way back. Renders nothing without the file.
 */
export function OtherProjects({ projects }: { projects: Projects | null }) {
  const items = projects ? shownItems(projects) : [];
  if (!projects || items.length === 0) return null;
  const leads = items.filter((i) => i.lead);
  const rest = items.filter((i) => !i.lead);
  return (
    <>
      <aside className="elsewhere" aria-labelledby="elsewhere-title">
        <h3 className="elsewhere__title" id="elsewhere-title">
          Other things I'm building
        </h3>
        <ul className="elsewhere__list">
          <li className="elsewhere__item">
            <WakeLight />
          </li>
          {leads.map((item) => (
            <li className="elsewhere__item" key={item.id}>
              <Line item={item} accent />
            </li>
          ))}
        </ul>
        {rest.length > 0 && (
          <ul className="elsewhere__list elsewhere__list--quiet">
            {rest.map((item) => (
              <li className="elsewhere__item" key={item.id}>
                <Line item={item} accent={false} />
              </li>
            ))}
          </ul>
        )}
        <p className="elsewhere__more">
          <a href={projects.more.href}>{projects.more.text}</a>
        </p>
      </aside>
      <p className="elsewhere__return">Back to the n-of-1 project</p>
    </>
  );
}
