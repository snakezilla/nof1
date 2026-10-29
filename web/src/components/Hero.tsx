import { splitLine } from "../lib/projects";
import { HERO, STORY_DECK, chapterId, type ChapterLink } from "../lib/story";

/** The page's one idea: the h1, one sentence naming the stops, and the chapters as links. */
export function Hero({ chapters }: { chapters: readonly ChapterLink[] }) {
  const [before, em, after] = splitLine(HERO);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <h1 className="hero__line" id="hero-title">
        {before}
        <span className="hero__em">{em}</span>
        {after}
      </h1>
      <p className="hero__deck">{STORY_DECK}</p>
      <nav className="index" aria-label="Chapters">
        <ol className="index__list">
          {chapters.map((c) => (
            <li key={c.key}>
              <a className="index__link" href={`#${chapterId(c.key)}`}>
                {c.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
