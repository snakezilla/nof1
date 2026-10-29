const FALLBACK_REPO = "https://github.com/snakezilla/nof1";

const safeUrl = (url: string): string =>
  /^https:\/\/github\.com\//.test(url) ? url : FALLBACK_REPO;

/** Two links: the source code, and the way on to byahsan.com from projects.json. */
export function Footer({
  repo,
  more,
}: {
  repo: string;
  more?: { readonly text: string; readonly href: string };
}) {
  return (
    <footer className="footer">
      <p className="footer__note">
        <a href={safeUrl(repo)}>Source code</a>
        {more && (
          <>
            {" "}
            <a href={more.href}>{more.text}</a>
          </>
        )}
      </p>
    </footer>
  );
}
