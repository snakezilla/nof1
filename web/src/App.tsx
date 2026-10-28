import type { DataState } from "./lib/dataset";
import { DECK, headline, sourceLine, sourceStats } from "./lib/sources-text";
import type { Dataset } from "./lib/types";
import { DataError } from "./components/DataError";
import { Findings } from "./components/Findings";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { OtherProjects } from "./components/OtherProjects";
import { Provenance } from "./components/provenance/Provenance";
import { JoinedYear } from "./components/sources/JoinedYear";
import { Joining } from "./components/sources/Joining";
import { MaskSection } from "./components/sources/MaskSection";
import { WhereSection } from "./components/sources/WhereSection";
import { YearSection } from "./components/YearSection";

function Page({ data }: { data: Dataset }) {
  const { patterns, meta, figures, rawStream, mask, projects } = data;
  const masked = mask !== null;
  return (
    <>
      <main id="main">
        <Hero
          headline={headline(meta.provenance)}
          deck={DECK}
          masked={masked}
          stats={sourceStats(meta.provenance)}
          source={sourceLine(meta.provenance)}
        />
        <WhereSection provenance={meta.provenance} />
        <Provenance provenance={meta.provenance} rawStream={rawStream} />
        <Joining fusion={meta.provenance?.fusion} />
        <OtherProjects projects={projects} />
        <JoinedYear masked={masked}>
          <YearSection figures={figures} />
          <Findings
            patterns={patterns}
            groups={figures?.sleep_groups}
            claims={figures?.claims}
          />
        </JoinedYear>
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
