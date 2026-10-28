# nof1, round two (2026-10-27)

Round one was built in one evening and reads like the default output of a generator: numbered section
markers, tracked caps eyebrows, a card kit, the data log before the point. Two independent reviews and
the QA matrix agreed. This is the plan for the page that replaces it. The data files, the statistics
and the honesty rules do not change; the presentation does.

## Brief

- **Subject**: a year of my own nights and training days, three findings with their numbers, one
  two-week experiment with a working check-in.
- **Reader**: a founder on an iPhone between meetings, twenty seconds, maybe a laptop later. He has
  built a personal health agent and has seen a thousand dashboards.
- **Job**: in one screen, show that I notice patterns in real data and ship; make him scroll once.
- **Voice**: plain, dry, specific. Never a dashboard, never a pitch, never a template.
- **Constraints**: React + Vite + TypeScript stay (the job he is hiring for is that stack). Data
  from `public/data/*.json` unchanged. No backend, no analytics. Tests stay green. No em dashes,
  no exclamation marks, sentence case everywhere.

## Reference moves, and what they become here

| Site | Their move | Ours |
|---|---|---|
| ryo.lu | A true sentence, set enormous, is the whole hero. Meta in small mono caps. No accent colour; the live data is the accent. | The first finding is the headline: "Weekends cost me N minutes of sleep." with the number as the only colour on the screen. Under it one mono line: the window, the counts, the source. |
| byahsan.com | Cream paper, a variable serif for the display line, colour only inside the sentence, hairlines, a live strip of real numbers. | Same tokens (light and dark), Fraunces for the hero and the three finding titles, Inter for everything else, colour inside display type only. |
| rauno.me | One shape, once. Nothing ambient. | One drawn thing on the page: the sleep line. No icons, no cards, no shadows, no section numbers. |

## System

**Type.** Two families, clearly different. Fraunces (variable, opsz and wght axes; fallback Georgia)
for display: the hero sentence, the three finding titles, the test title. Inter (fallback the system
sans stack with `size-adjust` so nothing reflows) for text. Mono is the local stack only (SF Mono,
Menlo, Consolas), no web font, for meta lines and table figures.

Scale, ratio 1.25 from 17 px, rounded:

| Token | px | Use | Line height | Tracking |
|---|---|---|---|---|
| `--text-xs` | 11 | mono meta lines, table headers (uppercase, tracked) | 1.5 | +0.08em |
| `--text-s` | 13.5 | captions, caveats, table cells on phones | 1.5 | 0 |
| `--text-m` | 17 | body | 1.55 | 0 |
| `--text-l` | 21 | deck under the hero, finding sentences | 1.45 | -0.005em |
| `--text-xl` | 27 | finding titles (Fraunces) | 1.2 | -0.01em |
| `--text-2xl` | 42 | hero on phones (Fraunces) | 1.05 | -0.02em |
| `--text-3xl` | 84 | hero from 1024 px (Fraunces) | 1.0 | -0.03em |

`font-variant-numeric: tabular-nums` on every numeric cell, figure and the check-in day strip.
Measure: text blocks `max-width: 62ch`.

**Space.** Base 4. `--space-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 24, `-6` 32, `-7` 48, `-8` 64,
`-9` 96. Section gap `--space-8` on phones, `--space-9` from 1024. Inside a section, `--space-5`
between blocks, `--space-2` between a label and its value. Page gutter 20 px at 320, 24 px at 390,
`--space-8` from 1024. Content max width 1040 px; text max width 62ch.

**Colour.** Six tokens plus two display inks, from the byahsan brand, with contrast checked on
these exact pairs:

| Token | Light | Dark | Note |
|---|---|---|---|
| `--bg` | #F5F1E8 | #1a1611 | |
| `--surface` | #EDE9E0 | #221e17 | input fields, the check-in strip |
| `--text` | #1a1a1a | #ede8dc | |
| `--muted` | #5f5953 | #a89f8e | 6.1:1 on cream, 6.9:1 on dark; round one's #7a776e failed at 4.0 |
| `--rule` | #d4cfc6 | #38322a | hairlines, 1px, `border` not div |
| `--accent` | #c4653a | #d98a5f | terracotta; display type and the focus ring only (3.5:1 on cream is fine at 42 px and up, never for small text) |
| `--ink` | #33503f | #a7c4ad | ink green; the sleep line and the one green word if a finding needs it |

Defined on `:root`, redefined under `@media (prefers-color-scheme: dark)` guarded by
`:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`. No other hex in the
CSS. No shadows anywhere. No gradients. Radius 0 on everything except the check-in buttons (4 px).

**Layout.** One column, left-aligned, content-first. The order is the fix the reviews asked for.

```
390                                1440
┌──────────────────────────┐        ┌──────────────────────────────────────────────────────┐
│ nof1               (sun) │        │ nof1                                           (sun) │
│                          │        │                                                      │
│ Weekends cost me         │        │ Weekends cost me NN minutes of sleep.                │
│ NN minutes               │        │                                                      │
│ of sleep.                │        │ Short nights are not paid back the next night.       │
│                          │        │ Training days cost almost nothing. 240 nights of my  │
│ Short nights are not     │        │ own data, one test to run.                           │
│ paid back the next night.│        │                                                      │
│ Training days cost almost│        │ MAY 2024 TO APR 2025  240 NIGHTS  156 TRAINING DAYS  │
│ nothing. 240 nights of my│        │ APPLE HEALTH EXPORT                                  │
│ own data, one test to run│        ├──────────────────────────────────────────────────────┤
│                          │        │ Three findings                                       │
│ MAY 2024 TO APR 2025     │        │ ──────────────────────────────────────────────────── │
│ 240 NIGHTS 156 TRAINING  │        │ Weekends cost me sleep            A.A h   vs  B.B h  │
│ DAYS  APPLE HEALTH EXPORT│        │ finding sentence …                weekend  weekday   │
├──────────────────────────┤        │ n = 64, n = 176, −D.D h, 95% interval −L.L to −H.H  │
│ Three findings           │        │ caveat …                                             │
│ ──────────────────────── │        │ ──────────────────────────────────────────────────── │
│ Weekends cost me sleep   │        │ (two more, same shape)                               │
│ A.A h weekend  B.B h wkd │        ├──────────────────────────────────────────────────────┤
│ n … interval …           │        │ The test                                             │
│ caveat                   │        │ Two weeks of weekday wake-ups on the weekend          │
│ ──────────────────────── │        │ hypothesis · protocol (numbered) · baseline · success│
│ …                        │        │ Daily check-in (working)                             │
├──────────────────────────┤        ├──────────────────────────────────────────────────────┤
│ The test                 │        │ The nights                                           │
│ …                        │        │ sleep line (one, ink green), 14-night window marked  │
│ Daily check-in           │        │ Date   Sleep   Awake   Bedtime   Training            │
├──────────────────────────┤        │ 14 rows, hairlines, tabular   [Show all 60 nights]   │
│ The nights               │        ├──────────────────────────────────────────────────────┤
│ sleep line               │        │ Built in one evening … · Source · github             │
│ 14 rows (2 cols on phone)│        └──────────────────────────────────────────────────────┘
│ [Show all 60 nights]     │
├──────────────────────────┤
│ footer                   │
└──────────────────────────┘
```

Hero: fills the first screen at 390 x 664 and at 1280 x 720; the sentence is the only large thing.
Findings: a list separated by hairlines, not cards; each has a Fraunces title, the sentence, a
numbers row (two figures with their labels and n, then difference and interval), and the caveat in
muted small text. Test: title, hypothesis, protocol as a plain numbered list (the fake checkboxes
go), baseline figures, what success looks like, then the check-in. Nights: the sleep line is the only
drawing; the 60-night window is a single hairline bracket, labelled in mono at the ends; below it a
table (Date, Sleep, Awake, Bedtime, Training), 14 rows, "Show all 60 nights" expands in place. The
Mindful column is gone (empty in 60 of 60). Gaps in the data get one muted row ("no data for N
nights"). Footer: the honesty line, source link, GitHub, nothing else.

**Motion.** Nothing on load. Check-in buttons: background 150 ms ease-out; day dot fill 150 ms.
"Show all 60 nights" expands without animation. Under `prefers-reduced-motion` all durations are 0.

**States.**
- No JavaScript: the full page is pre-rendered at build (see Engineering), so the crawler, the
  reader mode and the slow connection see the real page; only the check-in needs JS, and without it
  it shows a one-line note.
- Fonts not yet loaded: fallback stack with `size-adjust` so the hero does not reflow; `font-display: swap`.
- Check-in empty: "No check-ins yet. Answer today's two questions to start."
- Check-in saved: the day dot fills and the label reads "Day 3 of 14. Saved on this device."
- Data shape wrong: a plain sentence, "Could not read the data files. The repo has the raw JSON."
- Focus: 2 px `--accent` outline, offset 2 px, on every control; buttons and links at least 44 px tall on touch widths.
- Print: nav and check-in hidden, dark text on white.

**Copy.** Hero sentence is computed from `patterns.json` so it can never drift: the first pattern's
difference in minutes, "Weekends cost me N minutes of sleep." The deck is three plain sentences
built from patterns two and three and `meta.json`: "Short nights are not paid back the next night.
Training days cost almost nothing. 240 nights of my own data, one test to run." Section titles are
plain nouns in sentence case: Three findings, The test, The nights. The button says "Show all 60
nights"; after expanding it says "Show the last 14". The window line says when the data ends, in
words: "May 2024 to April 2025, 240 nights, 156 training days, from an Apple Health export."

**Metadata.** `<title>nof1</title>`; description "A year of my own nights and training days, three
findings with their numbers, one two-week experiment."; `og:title`, `og:description`, `og:image`
(1200 x 630, generated at build by screenshotting `/og` at that size: the hero sentence on cream, the
wordmark small); `twitter:card summary_large_image`; favicon as an inline SVG "n" in `--text`;
`<html lang="en">`.

**The one memorable thing.** The sentence. A finding from the person's own body, set like a
headline, with one number in terracotta, on paper. Everything after it is footnotes.

## Defaults check (principles.md, "Defaults that read as generated")

Item 1 (cream, serif display, terracotta) is on purpose: it is the byahsan brand and the user named
it as the direction. Items 5, 6, 7 (eyebrow caps on every heading, numbered markers, fade-ins) were
in round one and are removed. The mono caps meta line stays because ryo.lu is the named reference
and it is used once, under the hero, not as chrome on every block.

## Engineering notes

- Pre-render: add `src/entry-server.tsx` exporting `render(data)` with `renderToString`, build it
  with `vite build --ssr`, and a `scripts/prerender.mjs` that reads `public/data/*.json`, renders the
  app into `dist/index.html` (`<div id="root">…</div>`) and embeds the data as
  `<script id="nof1-data" type="application/json">`. The client reads that script and calls
  `hydrateRoot`; keep the fetch path as a fallback in dev. `package.json` `build` runs client build,
  server build, prerender, then the og image.
- OG image: `scripts/og.mjs` uses Playwright (`uv run --with playwright` is fine, or the project's
  node Playwright if present) to screenshot `dist/og.html` at 1200 x 630 into `dist/og.png`, and the
  same file is committed to `public/og.png` so Vercel serves it without the build step if needed.
- Keep components small; immutable updates only; no console.log; tests for the new text builders
  (hero sentence, deck, window line), the 14/60 toggle, the table rows and the gap rows.
- QA: `~/.claude/skills/design/scripts/qa.sh http://localhost:4173 ./qa/<n> --theme-attr` on
  `vite preview`, until report.md is clean and the contact sheet reads as one family. Keep `qa/` out
  of git.

## Rejected

- A second drawn thing (an HRV line): there is no HRV in the data.
- Cards for the findings: the numbers row reads better on a hairline list, and cards were the tell.
- Animated anything on load.
- A dark-mode toggle in the header beyond the sun button: the OS setting is enough; the button stays
  because byahsan.com has one.

## Review scores (fill in after QA)

| Line | Score | Reason |
|---|---|---|
| One idea | 4 | The sentence still owns the first screen; the new source line sits under the mono line in muted small type, so it answers "where from" without competing. The phone page is longer again (the second sources table adds about 1,400 px at 390). |
| The memorable thing | 4 | The sentence, the year grid, and now one squircle pipeline with my own exporter outlined in terracotta. The hero band at 1440 is still wide and empty. |
| Type | 4 | No new sizes. Figure labels stay mono `--text-xs`: HTML in F1 to F5, SVG text in F7, which is safe only because F7 is drawn at 1:1. Tabular figures in the stat row, tables, axes and pipeline labels. |
| Space | 4 | Kicker, drawing, legend, caption use the same four steps in every figure. The strip-plot rows run a little tall (60 px bands) to fit 11 lanes of dots. |
| Colour | 5 | No new tokens or hex. Pipeline nodes are `--surface` with a `--rule` outline, wires `--text`, labels `--muted`, the dashed way in `--muted`, and only the HealthExporter node in `--accent`. Dashed edge checked in dark at 390 and 1440: still visible. |
| Layout | 4 | F7 is three 1:1 drawings (280 px vertical under 640, 556 px from 640, 731 px from 1024) so its 11 px labels never scale; no overflow at 320. At 768 the dashed branch runs long under the chain. |
| Motion | 5 | Nothing new moves. |
| States | 4 | provenance missing or wrong: the hero line is dropped and the section says one plain sentence; a wrong all_sources only drops the second table. No-JS shows everything (all pre-rendered SVG and tables). |
| Copy | 4 | Lead's verbatim copy; every count, the 2:05 times and the 9 "ms" come from meta.json and are tested; tests forbid "hack", contractions, em dashes and "!". |
| Proof | 4 | 169 tests. qa.sh runs 8 to 10 clean in all 13 frames (the console error is the blocked font request). Read the section at 320, 390 light and dark, 768 and 1440 light and dark. Keyboard walk: 21 stops, ring on each, 44 px each; the hero link lands on the section. No real Safari, no screen reader. |

Removed: the second baseline figure (the weekday average as "the target"). The success line and finding one already state it.

Changed from the plan, on purpose: the deck uses the pattern titles ("I do not catch up the next night. Training days cost little sleep, if any.") rather than "Training days cost almost nothing", because the training gap was smaller than the weekend gap the hero calls a cost. The footer drops "in one evening", because round two was not built in one evening.

Then remove one thing.

## Round three: figures (2026-10-27)

Ahsan: "present the data in a better format. the long studies present data pretty well." The
Oversite study reports (`~/Desktop/oversite-exec-summary-2026-10-15/siu-demolition-report-long-v11.pdf`)
do five things we borrow: a row of four headline counts with small captions; a timeline where every
event is its own mark on a row per day, in one ink with one accent for the thing that matters;
one-sentence headlines over each figure and a muted caption under it that says what the shading
means; "no reading" drawn as an outline or hatch, never as empty; and a closing table where every
claim is scored with a verdict. Charts are inline SVG, one ink, no gridlines, mono axis labels.

All numbers come from `public/data/figures.json`, written by `prep/figures.py`; nothing is typed in
components. Every figure has an `aria-label` and a visually hidden one-sentence summary.

Colour: data marks in `--ink` (green); the highlighted subset only in `--accent` (terracotta): the
weekend rows, the "after a short night" group, the "at the edge" verdict. Cells with no reading are
outlined in `--rule`, not filled. Legends are one line of mono under the figure.

| # | Figure | Where | Idiom from the study |
|---|---|---|---|
| F0 | Four counts: nights with a reading, median night, nights under 6 h, training days; captions in muted small; mono window line stays below | under the deck | the 118.6 h / 832,703 frames row |
| F1 | Every night of the year: a week-by-weekday grid, one cell per night shaded by hours (5 steps, under 5 h to 9 h+), Sat and Sun as the bottom two rows with a terracotta bracket at the left, month labels on top, outlined cells for no reading. Under 640 px the grid turns: weeks as rows, weekdays as columns, so cells stay 24 px or more. | new section "A year of nights", right after the hero | the "every hour of the study" grid |
| F2 | Strip plots: one row per group, every night a 6 px dot at its hours on a 0 to 12 h axis, the mean as a 2 px vertical tick with its value, the share under 6 h printed at the row end. Weekend / short-night / training rows use the accent, their pair uses the ink. Three of them, one under each finding's sentence (weekend vs weekday; after a night under 6 h vs after 7 h+; after a training day vs after a rest day). | inside each finding | the "every truck visit" rows |
| F3 | A typical night: one horizontal bar from the median lights-out (left label, clock time) to the median wake (right label), the asleep span in ink, the awake minutes as an outlined segment at the end, the hours printed on the bar. | in The test, above the protocol | "a truck's turn at the spot" |
| F4 | When I went to bed: two strip rows (weekend, weekday) on a 10 pm to 3 am axis, medians as ticks with clock labels, the gap between them bracketed. | in The test, under F3 | same rows idiom |
| F5 | Month by month: one row per month, a stacked bar of training minutes by type in three ink tints (cycling, strength, everything else; the two largest types over the year, then the rest), the month's nights and median sleep printed at the right in tabular figures. | in The nights, above the table | "where the excavator's minutes go" |
| F6 | Every claim, scored: a table with claim, the two figures, n, difference, 95% interval, verdict ("holds" in text, "at the edge" in accent). | new last section before the footer | "every claim, scored against independent labels" |

Each figure: a mono small-caps kicker line above (what the marks are), the drawing, a caption in
muted `--text-s` below (what the shading means, and the one thing to see). Figures sit full width
of the text column on phones and up to 880 px on laptops. No animation. Tooltips are not needed;
the table and the captions carry the numbers.

## Round three notes

Built F0 to F6 as pure components over `src/lib/figures.ts` (scales, calendar placement, lane packing,
clock ticks, tints, verdicts) and `src/lib/figure-text.ts` (labels, summaries, captions). Text sits in
HTML positioned by percentage, never in SVG, so a scaled viewBox cannot shrink an axis label; dots are
zero-length round-capped strokes with `vector-effect: non-scaling-stroke`, so they stay 6 px circles in
a stretched viewBox. Tried and rejected: one viewBox for the year grid at all widths (cells fell to 6 px
on phones), dots with fill opacity for density (a single path does not compound, and 800 separate
circles bloat the pre-rendered page), "darker is more sleep" (wrong in dark mode, where more is
brighter), terracotta text for "at the edge" (3.5:1 on cream fails small text, so it is a terracotta
square beside text in `--text`). Changed from the spec on purpose: the five steps are under 5, 5 to 6,
6 to 7, 7 to 8 and 8 h or more, because a "9 h+" step would hold almost no nights; F5 uses cycling, strength and
everything else as the lead asked (the table above says walking); F0 is a list and F6 a real table, not
`role="img"`, because their numbers are text a screen reader should read. Still imperfect: on phones the
strip dots are packed for a 520 px row, so they overlap more; 18 bedtimes outside 10 pm to 3 am are
pinned to the axis ends as small columns (the caption says so); the turned year grid makes the phone
page long; the hero band at 1440 is still empty.

## Round four: where the data comes from (2026-10-27)

Ahsan: make the source of the data unmistakable, and say how it was got out of closed systems. He
pointed at https://www.arlan.me/vault; that is a gallery of typographic and UI effects (squircles,
kinetic type, emboss), not a data source, so it is used here as a style reference only: one effect,
once, where it carries meaning. The effect we take is the squircle ("Apple's corners"), for the nodes
of the pipeline figure, drawn as an SVG superellipse path, not `border-radius`. Nothing animates.

All facts in this section come from `meta.json` → `provenance` (written by `prep/build.py`): which
app wrote each kind of record into Apple Health inside the window, the counts, and the exclusions
with their reasons. Nothing about sources is typed into components.

**Placement.** Two places, because he wants it unmistakable:
1. Under the hero's mono window line, one plain sentence in `--text-s` muted with a link:
   "Every number here comes from a WHOOP 4.0 strap, through Apple Health, pulled out by an app I
   wrote. [How the data got here]" The link scrolls to the section.
2. A section "Where the data comes from", after "Every claim, scored" and before the footer.

**The section, top to bottom.**

- Kicker + title: "Where the data comes from". One-sentence deck: "No API keys and no exports from
  anyone's cloud. The strap writes into Apple Health; my own app reads Apple Health out."

- F7, the pipeline figure (SVG, full text width, stacks vertically under 640 px): squircle nodes
  joined by 1 px hairlines with small arrowheads, mono edge labels carrying the counts:

  ```
  [WHOOP 4.0 strap] ──► [WHOOP app] ──250 nights, 226 workouts──► [Apple Health] ──► [HealthExporter, mine] ──► [iCloud] ──► [CSV on my Mac] ──► [prep/, Python] ──► [this page]
                                      [Strava] ──27 workouts──►  ▲
                                      [SnoreLab] ──3 nights──►  ▲
  [WHOOP 4.0 strap] ┄┄Bluetooth, Unstrap┄┄► [20,341 HRV rows, excluded]   (dashed, muted; the only dashed edge)
  ```
  The HealthExporter node is the one outlined in `--accent`, because it is the part that is mine and
  the part that makes the rest possible. Caption: "Solid lines are the data on this page. The dashed
  line is a second way in that I built and then left out; the reasons are below."

- A sources table (real `<table>`, hairline rows, tabular figures): App · What it wrote into Apple
  Health · In the window · How it got out. Rows from `provenance.nights_by_app` and
  `provenance.workouts_by_app`: WHOOP (sleep as asleep and awake segments; workouts) 250 nights,
  226 workouts, "the WHOOP app writes to HealthKit when it syncs"; Strava (workouts) 27, "Strava
  writes to HealthKit"; SnoreLab (sleep) 3 nights, "writes to HealthKit". Then the exporter row:
  HealthExporter, "everything above, out of HealthKit into CSV and JSONL on iCloud, twice a day".

- "How I got it out", three short paragraphs in body text, first person, present tense, no
  bravado and no false claims:
  1. WHOOP shows your own data only through its app and sells API access to partners. The app does
     write what it measures into Apple Health, so Apple Health became the hub.
  2. Apple lets an app you build and sign yourself read your own HealthKit store. I wrote one:
     HealthExporter. It runs anchored queries over every sample type, backfills a lifetime on first
     run, writes JSONL and CSV into an iCloud Documents container, and fires on launch, from an iOS
     Shortcut at 2:05 am and 2:05 pm, and on HealthKit observer callbacks. iCloud carries the files to
     my Mac. (Use `provenance.exporter` for the wording.)
  3. I also went in the other way: an open-source tool that reverse-engineered the strap's Bluetooth
     protocol reads it directly, on an hourly job on my Mac, no app in between. That stream is on
     disk and is not on this page. Its HRV figures are not SDNN in
     milliseconds, and two of its nights are overlapping segments that do not add up to a night. When a source does not reconcile,
     it is left out and the reason is written down.

- "Left out, and why": a compact list from `provenance.excluded` (what, rows, why), in `--text-s`.

- Last line: "The code that reads the files and makes every cut is public: github.com/snakezilla/nof1,
  `prep/load.py`." Link the repo.

**Copy rules for this section.** Say "read", "wrote", "got out", never "hacked" on the page itself.
No claim that any cloud, account or API was accessed. No em dashes, sentence case, plain verbs.
Counts and dates only from the JSON.

**Defaults check.** The squircle is a borrowed effect used once and for a reason (nodes in a
pipeline, the subject's own vocabulary: Apple Health, an iPhone app). It does not go anywhere else.

## Round four notes

Built as pure builders (`src/lib/provenance.ts` for the graph, `provenance-text.ts` for the copy and
table rows, `pipeline-layout.ts` and `pipeline-layouts.ts` for placement, `squircle.ts` for the
superellipse corners, n = 5) and seven small components in `src/components/provenance/`. The copy is
the lead's final wording, which replaced the paragraphs above; the section has no kicker, as in the
other sections, and the figure carries its own mono line. F7 is drawn three times at 1:1 and CSS
shows one, so no script is needed and text never shrinks. Tried and rejected: one viewBox scaled to
width (11 px labels fell to 7 px at 640), and a single-row chain at laptop width (eight nodes do not
fit 880 px with readable labels), so the chain returns under the hub like a line of text. The
"Everything else in my Health store" table reads `provenance.all_sources`; its status carries the
reason after a colon, and record types keep their own case (HRV, ECG) and stop at three, then "and
N more". Under 640 px its Records and Dates fold into one cell. A source marked used that puts nothing on the page (Balance) moves to that table; its reason, "Mindful minutes on 19 days, too few to show", counts days from daily.json. The first table names the types each app wrote that the page does not use (WHOOP heart rate, breathing rate, blood oxygen; Strava routes). Device names (WHOOP 4.0 strap) and
the four downstream steps are the only words typed in lib, not taken from the JSON. Still imperfect:
the phone page is long; at 768 the dashed branch runs the full height of the figure.

## Round five: sources and fusion first, values masked (2026-10-27)

Ahsan: the interesting part is where the sources came from and the work to join them, not the
analysis; and he does not want his real numbers on the page. The page now reads: headline (the count
of apps that wrote to Apple Health, without the ECG app and unknown apps, computed: 12), the deck,
the mask note in its own hairline block with an outlined "Masked" label, four source counts; "Where
my data lived" (F8, one row per source on a 2020 to 2026 axis, used in ink, others muted, excluded
dashed, the window as a `--surface` band); "How I got it out" (the old provenance section; its h3
became "Why through Apple Health" so the title is not repeated); "Joining it" (counts from
`provenance.fusion`); "What a joined year looks like" (the five analysis sections demoted one heading
level, every figure kicker prefixed "Masked data." through `MaskedContext`); "How the masking works"
from mask.json. The old hero sentence is now the first finding's title.

F8 is HTML placed by percent, like F1 to F5, so the 11 px labels never scale; under 640 px the name
and count sit on one line and the track runs full width under them. No new tokens.

Imperfect: the headline says 12 apps and the stat row says 14 apps and devices (the ECG app and the
unknown app count as records but not as apps that measured me). The pins in the tests are the
masked values for the current seed; a new seed means new pins. "How I got it out" is still about
5,000 px long on a phone.

Note on the numbers in this file: rounds two to four were written against the real data. Every
health value quoted in them has been replaced with a placeholder or neutral wording, because the page
now ships masked values only (round five). Counts of nights and days, dates and app names are real.

## Aside: other things I'm building (2026-10-28)

An `<aside>` directly before "Three findings", from `public/data/projects.json` (hand-curated from
byahsan.com, validated by `src/lib/projects.ts`; the page renders without it and the build refuses a
wrong one). It is 40rem wide, muted, with hairlines above and below. The bottom hairline stands in for
the findings section's top rule so the two rules never sit on top of each other. Each item is one
Fraunces line in `--muted` with one phrase in `--accent`, as on byahsan.com, followed by a muted
sub-line. The whole line is the link. Changed on purpose: the accent appears here at 27 px, not only
at 42 px and up. 27 px counts as large text, and the accent passes the 3:1 bar for large text in
both themes. The validator only lets through links to byahsan.com, needs the accent phrase to be
inside its line, and refuses em dashes, exclamation marks and the words customers, pilots, ManageXR
and Luke. An item with a `todo` field never renders; the first item is such a placeholder. No images.

## Lean pass (2026-10-28)

Ahsan: "make it more lean, to the point." Long pages that keep every figure and caveat now read as
generated. The page is cut to: hero (two-sentence deck, one-sentence mask note, four counts, a mono
source line), "Where my data lived" (F8), "How I got it out" (three steps, F7, the used-apps table
with one "Dropped" line, the raw signal in two sentences), "Joining it" (four counts, then Next), the
aside (five lines, no sub-lines), "What a joined year looks like" (the "Masked data." label once,
F1, then three findings as title, strip plot and one line with the numbers and the verdict), and
"How the masking works" in two sentences. The footer is one line and the repo link.

Cut: the typical night, bedtimes, month rows, the sleep line, the 60-night table, The test and its
check-in, the claims table (its verdicts now sit on each finding's line), the second sources table,
"Why through Apple Health", "Left out, and why" as a list, every figure kicker and the per-figure
mask prefix. The page no longer loads daily.json or test.json (prep/ still writes them). Tests pin
the five h2s in order and two sentences at most per visible paragraph.

Changed on purpose: the hero no longer fills the first screen; the desktop section gap is 64 px,
not 96; from 1024 px each finding is one band, the title and its line on the left and the strip
plot on the right. Height of the full page: 1440 went from 12,619 to 4,996 px (40%), 390 from
19,149 to 8,549 px (45%). The three strip plots are most of what keeps 1440 above one third.

Patent item (2026-10-28): the aside's first item is the filed provisional patent. It has no link,
so it shows its sub-line in place of one; the validator allows a missing href only when a sub-line
is there. Its sub-line is three sentences, the lead's wording word for word, and is the one
exception to the two-sentence rule (the test names it). After this item, 1440 is 5,101 px and 390
is 8,706 px.
