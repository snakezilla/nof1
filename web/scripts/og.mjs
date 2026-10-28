// Screenshots dist/og.html at 1200 x 630 into dist/og.png, and keeps public/og.png in step so
// the image is served even without this build step. Headless; no window opens.
import { copyFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(import.meta.url), "../..");
const out = join(root, "dist/og.png");

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      colorScheme: "light",
    });
    await page.goto(pathToFileURL(join(root, "dist/og.html")).href, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out, type: "png" });
  } finally {
    await browser.close();
  }
  await copyFile(out, join(root, "public/og.png"));
  process.stdout.write("og: dist/og.png, public/og.png\n");
};

main().catch((err) => {
  process.stderr.write(`og image failed: ${err.message}\n`);
  process.exit(1);
});
