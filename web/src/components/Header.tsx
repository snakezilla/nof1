import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="masthead">
      <a className="wordmark" href="#top" aria-label="nof1, back to the top">
        nof1
      </a>
      <ThemeToggle />
    </header>
  );
}
