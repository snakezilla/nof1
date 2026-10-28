import type { Bedtime, TypicalNight as Night } from "../lib/figure-types";
import { cleanNumbers } from "../lib/numbers";
import type { Experiment, Pattern } from "../lib/types";
import { Baseline } from "./Baseline";
import { CheckIn } from "./CheckIn";
import { findingAnchor } from "./Finding";
import { Bedtimes } from "./figures/Bedtimes";
import { TypicalNight } from "./figures/TypicalNight";

const ORDINALS = ["first", "second", "third", "fourth", "fifth"];

interface Props {
  test: Experiment;
  patterns: readonly Pattern[];
  today?: string;
  night?: Night;
  bedtime?: Bedtime;
}

export function TestSection({ test, patterns, today, night, bedtime }: Props) {
  const index = patterns.findIndex((p) => p.id === test.pattern_id);
  return (
    <section className="section" aria-labelledby="test-title">
      <h3 className="section__title" id="test-title">
        The test
      </h3>
      <h4 className="test__title">{test.title}</h4>
      <p className="test__hypothesis">{cleanNumbers(test.hypothesis)}</p>
      <p className="test__why">
        {test.why}
        {index >= 0 && (
          <>
            {" "}
            It tests{" "}
            <a href={`#${findingAnchor(test.pattern_id)}`}>
              the {ORDINALS[index] ?? `number ${index + 1}`} finding
            </a>
            .
          </>
        )}
      </p>
      {(night || bedtime) && (
        <div className="test__figures">
          {night && <TypicalNight night={night} />}
          {bedtime && <Bedtimes bedtime={bedtime} />}
        </div>
      )}
      <div className="test__grid">
        <div className="test__block">
          <h5 className="test__label">Protocol, {test.duration_days} days</h5>
          <ol className="protocol">
            {test.protocol.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <Baseline baseline={test.baseline} />
          <div className="test__block">
            <h5 className="test__label">It worked if</h5>
            <p>{cleanNumbers(test.success)}</p>
          </div>
        </div>
      </div>
      <CheckIn
        questions={test.checkin}
        duration={test.duration_days}
        today={today}
      />
    </section>
  );
}
