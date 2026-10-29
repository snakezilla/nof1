import type { DataState } from "./lib/dataset";
import { stepFor } from "./lib/projects";
import { DECK, headline, sourceLine, sourceStats } from "./lib/sources-text";
import { chapterLinks } from "./lib/story";
import type { Dataset } from "./lib/types";
import { DataError } from "./components/DataError";
import { Findings } from "./components/Findings";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Provenance } from "./components/provenance/Provenance";
import { JoinedYear } from "./components/sources/JoinedYear";
import { Joining } from "./components/sources/Joining";
import { MaskSection } from "./components/sources/MaskSection";
import { WhereSection } from "./components/sources/WhereSection";
import { OnMe } from "./components/story/OnMe";
import { StepChapter } from "./components/story/StepChapter";
import { YearSection } from "./components/YearSection";

/** One story in four chapters: the lab, me, the bedside, next. Then the masking note. */
function Page({ data }: { data: Dataset }) {
  const { patterns, meta, figures, rawStream, mask, projects } = data;
  const masked = mask !== null;
  return (
    <>
      <main id="main">
        <Hero chapters={chapterLinks(projects)} />
        <StepChapter step={stepFor(projects, "lab")} />
        <OnMe
          headline={headline(meta.provenance)}
          deck={DECK}
          masked={masked}
          stats={sourceStats(meta.provenance)}
          source={sourceLine(meta.provenance)}
        >
          <WhereSection provenance={meta.provenance} />
          <Provenance provenance={meta.provenance} rawStream={rawStream} />
          <Joining fusion={meta.provenance?.fusion} />
          <JoinedYear masked={masked}>
            <YearSection figures={figures} />
            <Findings
              patterns={patterns}
              groups={figures?.sleep_groups}
              claims={figures?.claims}
            />
          </JoinedYear>
        </OnMe>
        <StepChapter step={stepFor(projects, "bedside")} />
        <StepChapter step={stepFor(projects, "next")}>
          {projects && (
            <p className="chapter__more">
              <a href={projects.more.href}>{projects.more.text}</a>
            </p>
          )}
        </StepChapter>
        <MaskSection mask={mask} />
      </main>
      <Footer repo={meta.repo} masked={masked} />
    </>
  );
}

export default function App({ state }: { state: DataState }) {
  return (
    <div className="page" id="top">
      <Header />
      {state.status === "ready" && <Page data={state.data} />}
      {state.status === "error" && (
        <main id="main">
          <DataError detail={state.message} />
        </main>
      )}
      {state.status === "loading" && (
        <main id="main">
          <p className="loading" role="status">
            Loading the data.
          </p>
        </main>
      )}
    </div>
  );
}
