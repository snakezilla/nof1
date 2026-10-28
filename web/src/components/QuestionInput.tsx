import { useState, type ChangeEvent } from "react";
import type { AnswerValue } from "../lib/checkin";
import type { CheckinQuestion } from "../lib/types";

interface Props {
  question: CheckinQuestion;
  value: AnswerValue | undefined;
  onAnswer: (v: AnswerValue) => void;
}

const range = (min: number, max: number): readonly number[] =>
  Array.from(
    { length: Math.min(11, Math.max(0, max - min + 1)) },
    (_, i) => min + i,
  );

function Choice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`choice${active ? " is-active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function NumberField({
  question,
  value,
  onAnswer,
}: Props & { question: Extract<CheckinQuestion, { type: "number" }> }) {
  const [draft, setDraft] = useState(
    typeof value === "number" ? String(value) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const { min, max } = question;

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    if (raw.trim() === "") return setError(null);
    const n = Number(raw);
    if (!Number.isFinite(n)) return setError("Enter a number.");
    if (min !== undefined && n < min) return setError(`Use ${min} or more.`);
    if (max !== undefined && n > max) return setError(`Use ${max} or less.`);
    setError(null);
    onAnswer(n);
  };

  return (
    <div className="numfield">
      <input
        id={`q-${question.id}`}
        className="numfield__input"
        type="number"
        inputMode="decimal"
        min={min}
        step={question.step ?? "any"}
        max={max}
        value={draft}
        onChange={onChange}
        aria-invalid={error !== null}
        aria-describedby={error ? `q-${question.id}-err` : undefined}
      />
      {error && (
        <span
          className="numfield__error"
          id={`q-${question.id}-err`}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}

export function QuestionInput({ question, value, onAnswer }: Props) {
  const labelId = `q-${question.id}-label`;
  return (
    <div className="question" role="group" aria-labelledby={labelId}>
      {question.type === "number" ? (
        <label
          className="question__q"
          id={labelId}
          htmlFor={`q-${question.id}`}
        >
          {question.q}
        </label>
      ) : (
        <p className="question__q" id={labelId}>
          {question.q}
        </p>
      )}
      {question.type === "scale" && (
        <div className="choices">
          {range(question.min, question.max).map((n) => (
            <Choice
              key={n}
              label={String(n)}
              active={value === n}
              onClick={() => onAnswer(n)}
            />
          ))}
        </div>
      )}
      {question.type === "yesno" && (
        <div className="choices">
          <Choice
            label="Yes"
            active={value === true}
            onClick={() => onAnswer(true)}
          />
          <Choice
            label="No"
            active={value === false}
            onClick={() => onAnswer(false)}
          />
        </div>
      )}
      {question.type === "number" && (
        <NumberField question={question} value={value} onAnswer={onAnswer} />
      )}
    </div>
  );
}
