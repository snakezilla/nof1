import { describe, expect, it } from "vitest";
import { embedJson, readEmbedded, toState } from "../dataset";
import { currentTheme, otherTheme, toggleName } from "../theme";
import { publicRaw } from "../../test/fixtures";

const embed = (text: string): Document => {
  const doc = document.implementation.createHTMLDocument("t");
  const node = doc.createElement("script");
  node.id = "nof1-data";
  node.type = "application/json";
  node.textContent = text;
  doc.body.append(node);
  return doc;
};

describe("toState", () => {
  it("is ready for the shipped files", () => {
    expect(toState(publicRaw()).status).toBe("ready");
  });

  it("returns an error, not a throw, when a file has the wrong shape", () => {
    const state = toState({ ...publicRaw(), meta: { days: "many" } });
    expect(state).toEqual({
      status: "error",
      message: "meta.json: does not match the schema",
    });
  });
});

describe("readEmbedded and embedJson", () => {
  it("round-trips the data through the page", () => {
    const state = readEmbedded(embed(embedJson(publicRaw())));
    expect(state?.status).toBe("ready");
  });

  it("escapes anything that could close the script element", () => {
    const raw = { ...publicRaw(), meta: { note: "</script><b>" } };
    expect(embedJson(raw)).not.toContain("</script>");
    expect(JSON.parse(embedJson(raw)).meta.note).toBe("</script><b>");
  });

  it("is null without embedded data and an error for broken JSON", () => {
    expect(
      readEmbedded(document.implementation.createHTMLDocument()),
    ).toBeNull();
    expect(readEmbedded(embed("{oops"))?.status).toBe("error");
  });
});

describe("theme", () => {
  it("prefers the reader's choice over the OS", () => {
    expect(currentTheme("light", true)).toBe("light");
    expect(currentTheme(undefined, true)).toBe("dark");
    expect(currentTheme(undefined, false)).toBe("light");
    expect(otherTheme("dark")).toBe("light");
    expect(toggleName("dark")).toBe("Use the light theme");
  });
});
