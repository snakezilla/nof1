import { shownItems, splitLine, type Projects } from "../lib/projects";

/** An aside of the other things I'm building, from projects.json. Renders nothing without it. */
export function OtherProjects({ projects }: { projects: Projects | null }) {
  const items = projects ? shownItems(projects) : [];
  if (!projects || items.length === 0) return null;
  return (
    <aside className="elsewhere" aria-labelledby="elsewhere-title">
      <h3 className="elsewhere__title" id="elsewhere-title">
        Other things I'm building
      </h3>
      <ul className="elsewhere__list">
        {items.map((item) => {
          const [before, em, after] = splitLine(item);
          return (
            <li className="elsewhere__item" key={item.id}>
              <a className="elsewhere__line" href={item.href}>
                {before}
                <span className="elsewhere__em">{em}</span>
                {after}
              </a>
              <p className="elsewhere__sub">{item.sub}</p>
            </li>
          );
        })}
      </ul>
      <p className="elsewhere__more">
        <a href={projects.more.href}>{projects.more.text}</a>
      </p>
    </aside>
  );
}
