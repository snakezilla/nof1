const FALLBACK_REPO = "https://github.com/snakezilla/nof1";

const safeUrl = (url: string): string =>
  /^https:\/\/github\.com\//.test(url) ? url : FALLBACK_REPO;

export function Footer({
  repo,
  masked,
  more,
}: {
  repo: string;
  masked: boolean;
  /** The way on to byahsan.com, from projects.json. */
  more?: { readonly text: string; readonly href: string };
}) {
  return (
    <footer className="footer">
      <p className="footer__note">
        Built with Claude Code from my own Apple Health export
        {masked ? ", masked with a private seed" : ""}.{" "}
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
