import type { DataState } from "./lib/dataset";
import { funnel } from "./lib/funnel";
import { stepFor } from "./lib/projects";
import { headline } from "./lib/sources-text";
import { chapterLinks } from "./lib/story";
import type { Dataset } from "./lib/types";
import { DataError } from "./components/DataError";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { OnMe } from "./components/story/OnMe";
import { Results } from "./components/story/Results";
import { StepChapter } from "./components/story/StepChapter";

/** One story in three chapters: the lab, me, the bedside. */
function Page({ data }: { data: Dataset }) {
  const { patterns, meta, figures, mask, projects } = data;
  const masked = mask !== null;
  return (
    <>
      <main id="main">
        <Hero chapters={chapterLinks(projects)} />
        <StepChapter step={stepFor(projects, "lab")} />
        <OnMe
          headline={headline(meta.provenance)}
          masked={masked}
          funnel={funnel(meta.provenance)}
        >
          <Results patterns={patterns} claims={figures?.claims} />
        </OnMe>
        <StepChapter step={stepFor(projects, "bedside")} />
      </main>
      <Footer repo={meta.repo} more={projects?.more} />
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
