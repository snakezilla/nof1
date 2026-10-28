import { useEffect, useState } from "react";
import {
  THEME_KEY,
  currentTheme,
  otherTheme,
  toggleName,
  type Theme,
} from "../lib/theme";

const prefersDark = (): boolean =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

const remember = (t: Theme): void => {
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(
      currentTheme(document.documentElement.dataset.theme, prefersDark()),
    );
  }, []);

  const flip = () => {
    const next = otherTheme(
      theme ??
        currentTheme(document.documentElement.dataset.theme, prefersDark()),
    );
    document.documentElement.dataset.theme = next;
    remember(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle js-only"
      onClick={flip}
      aria-label={theme ? toggleName(theme) : "Change the colour theme"}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </svg>
    </button>
  );
}
