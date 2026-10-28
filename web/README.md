# nof1

A one-page site that shows my own health data as a study of one person. It has a
timeline of recent days, three patterns from the full history, and one two-week
test with a daily check-in.

## Run it

```sh
pnpm install
pnpm dev        # local server
pnpm test       # unit and render tests
pnpm coverage   # coverage for src/lib
pnpm build      # static site in dist/
```

## Where the data comes from

The page reads four files from `public/data/`: `daily.json`, `patterns.json`,
`test.json` and `meta.json`. The shape is in `../DATA_SCHEMA.md`. The prep step
in `../prep/` builds them from my Apple Health export and the apps that write to
it. Each file is checked against the schema when the page loads; if a file is
missing or has the wrong shape, the page says so instead of showing partial data.

`node scripts/gen-sample.mjs` writes synthetic sample files that follow the
schema. It always writes `src/fixtures/` (used by the tests) and only writes
`public/data/` files that do not exist yet, so it never replaces real data.

## Privacy

Daily aggregates only; no raw readings leave my machine. There is no backend,
no analytics and no cookies. The check-in answers stay in your browser's
local storage and are never sent anywhere.
