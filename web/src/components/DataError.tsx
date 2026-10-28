const REPO = "https://github.com/snakezilla/nof1";

export function DataError({ detail }: { detail: string }) {
  return (
    <section className="data-error" role="alert">
      <h1 className="data-error__title">
        Could not read the data files. The repo has the raw JSON.
      </h1>
      <p className="data-error__detail">{detail}</p>
      <p>
        <a href={REPO}>Open the repo</a>
      </p>
    </section>
  );
}
