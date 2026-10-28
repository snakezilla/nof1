export type Theme = "light" | "dark";

export const THEME_KEY = "nof1.theme";

export const otherTheme = (t: Theme): Theme =>
  t === "dark" ? "light" : "dark";

/** The theme on screen: the attribute if the reader chose one, else the OS setting. */
export const currentTheme = (
  attr: string | undefined,
  prefersDark: boolean,
): Theme =>
  attr === "light" || attr === "dark" ? attr : prefersDark ? "dark" : "light";

export const toggleName = (t: Theme): string =>
  t === "dark" ? "Use the light theme" : "Use the dark theme";
