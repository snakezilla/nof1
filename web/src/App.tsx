import type { DataState } from "./lib/dataset";
import { mindfulDaysIn } from "./lib/provenance-text";
import { DECK, headline, sourceStats } from "./lib/sources-text";
import type { Dataset } from "./lib/types";
import { Claims } from "./components/Claims";
import { DataError } from "./components/DataError";
import { Findings } from "./components/Findings";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Nights } from "./components/Nights";
import { Provenance } from "./components/provenance/Provenance";
import { JoinedYear } from "./components/sources/JoinedYear";
import { Joining } from "./components/sources/Joining";
import { MaskSection } from "./components/sources/MaskSection";
import { WhereSection } from "./components/sources/WhereSection";
import { TestSection } from "./components/TestSection";
import { YearSection } from "./components/YearSection";

function Page({ data, today }: { data: Dataset; today?: string }) {
  const { daily, patterns, test, meta, figures, rawStream, mask } = data;
  const masked = mask !== null;
  return (
    <>
      <main id="main">
        <Hero
          headline={headline(meta.provenance)}
          deck={DECK}
          masked={masked}
          stats={sourceStats(meta.provenance)}
        />
        <WhereSection provenance={meta.provenance} />
        <Provenance
          provenance={meta.provenance}
          repo={meta.repo}
          mindfulDays={mindfulDaysIn(daily, meta.provenance?.window)}
          rawStream={rawStream}
        />
        <Joining fusion={meta.provenance?.fusion} />
        <JoinedYear masked={masked}>
          <YearSection figures={figures} />
          <Findings patterns={patterns} groups={figures?.sleep_groups} />
          <TestSection
            test={test}
            patterns={patterns}
            today={today}
            night={figures?.typical_night}
            bedtime={figures?.bedtime}
          />
          <Nights days={daily} months={figures?.months} />
          {figures && figures.claims.length > 0 && (
            <Claims claims={figures.claims} />
          )}
        </JoinedYear>
        <MaskSection mask={mask} />
      </main>
      <Footer repo={meta.repo} masked={masked} />
    </>
  );
}

export default function App({
  state,
  today,
}: {
  state: DataState;
  today?: string;
}) {
  return (
    <div className="page" id="top">
      <Header />
      {state.status === "ready" && <Page data={state.data} today={today} />}
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
