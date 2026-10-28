const FALLBACK_REPO = "https://github.com/snakezilla/nof1";

const safeUrl = (url: string): string =>
  /^https:\/\/github\.com\//.test(url) ? url : FALLBACK_REPO;

export function Footer({ repo, masked }: { repo: string; masked: boolean }) {
  return (
    <footer className="footer">
      <p className="footer__note">
        Built with Claude Code from my own Apple Health export
        {masked ? ", masked with a private seed" : ""}.{" "}
        <a href={safeUrl(repo)}>Source code</a>
      </p>
    </footer>
  );
}
