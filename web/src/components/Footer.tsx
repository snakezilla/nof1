const FALLBACK_REPO = "https://github.com/snakezilla/nof1";

const safeUrl = (url: string): string =>
  /^https:\/\/github\.com\//.test(url) ? url : FALLBACK_REPO;

/** "https://github.com/snakezilla/nof1" -> "https://github.com/snakezilla". */
export const profileUrl = (repo: string): string => {
  const url = new URL(safeUrl(repo));
  const owner = url.pathname.split("/").filter(Boolean)[0] ?? "";
  return `${url.origin}/${owner}`;
};

export function Footer({ repo, masked }: { repo: string; masked: boolean }) {
  return (
    <footer className="footer">
      <p className="footer__note">
        Built with Claude Code from my own Apple Health export. Daily aggregates
        only{masked ? ", masked with a private seed" : ""}; no raw readings
        leave my machine.
      </p>
      <p className="footer__links">
        <a href={safeUrl(repo)}>Source code</a>
        <a href={profileUrl(repo)}>GitHub</a>
      </p>
    </footer>
  );
}
