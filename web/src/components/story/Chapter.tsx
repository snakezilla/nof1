import type { ReactNode } from "react";
import { chapterId, type ChapterKey } from "../../lib/story";

/** One stop of the story: the mono label from the index, a Fraunces h2, then the chapter. */
export function Chapter({
  chapter,
  label,
  title,
  children,
}: {
  chapter: ChapterKey;
  label: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const id = chapterId(chapter);
  return (
    <section className="chapter" id={id} aria-labelledby={`${id}-title`}>
      <p className="chapter__label">{label}</p>
      <h2 className="chapter__title" id={`${id}-title`}>
        {title}
      </h2>
      {children}
    </section>
  );
}
