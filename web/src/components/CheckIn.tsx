import { useEffect, useState } from "react";
import {
  dayLabel,
  loadStore,
  saveStore,
  setAnswer,
  strip,
  type AnswerValue,
  type CheckinStore,
} from "../lib/checkin";
import { localIsoDate } from "../lib/dates";
import type { CheckinQuestion } from "../lib/types";
import { DotStrip } from "./DotStrip";
import { QuestionInput } from "./QuestionInput";

const storage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

interface Props {
  questions: readonly CheckinQuestion[];
  duration: number;
  /** Fixed date for tests; the page uses the reader's local date after it loads. */
  today?: string;
}

interface Loaded {
  readonly store: CheckinStore;
  readonly today: string;
  readonly saved: boolean;
}

/**
 * The server render and the first client render show the empty state, so hydration matches;
 * stored answers load after mount.
 */
export function CheckIn({ questions, duration, today }: Props) {
  const [state, setState] = useState<Loaded | null>(null);

  useEffect(() => {
    setState({
      store: loadStore(storage()),
      today: today ?? localIsoDate(new Date()),
      saved: true,
    });
  }, [today]);

  const store = state?.store ?? {};
  const day = state?.today ?? today ?? "";
  const answers = store[day] ?? {};

  const answer = (id: string, value: AnswerValue) => {
    if (!state) return;
    const next = setAnswer(state.store, state.today, id, value);
    setState({ ...state, store: next, saved: saveStore(storage(), next) });
  };

  return (
    <div className="checkin" role="group" aria-labelledby="checkin-title">
      <h4 className="checkin__title" id="checkin-title">
        Daily check-in
      </h4>
      <p className="checkin__status js-only" aria-live="polite">
        {dayLabel(store, day, duration, questions.length)}
      </p>
      <p className="no-js-only">
        The check-in needs JavaScript. The rest of the page does not.
      </p>
      <div className="js-only">
        {day && <DotStrip dots={strip(store, day, duration)} />}
        <div className="checkin__questions">
          {questions.map((q) => (
            <QuestionInput
              key={`${q.id}-${state ? "loaded" : "empty"}`}
              question={q}
              value={answers[q.id]}
              onAnswer={(v) => answer(q.id, v)}
            />
          ))}
        </div>
        <p className="checkin__note">
          {state?.saved === false
            ? "This browser blocks storage, so answers last only until you leave."
            : "Answers stay on this device. Nothing is sent anywhere."}
        </p>
      </div>
    </div>
  );
}
