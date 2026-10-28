# nof1

One evening, my own Apple Health export, one experiment at a time.

A year of nightly sleep and training days (May 2024 to April 2025; WHOOP, Strava and Nike Run Club
through Apple Health), reduced to daily aggregates, three patterns with the numbers behind them,
and a single two-week n-of-1 test with a working daily check-in.

- `prep/` Python, stdlib only. Reads the HealthExporter event CSVs, writes one row per day,
  computes every comparison with counts and a bootstrap 95% interval, and writes the pattern
  and test text from those numbers so the words cannot drift from the data.
- `web/` Vite + React + TypeScript. One page, no backend, no analytics. The check-in lives in
  localStorage only.

## Run

```bash
prep/run.sh            # masked: seed from ~/.nof1-seed (made once), writes web/public/data
prep/run.sh --real     # real values, to prep/private/ only (gitignored), never published
cd prep && python3 -m pytest
cd ../web && pnpm install && pnpm dev
```

## Privacy

The health values on the page are masked. Each day's values are multiplied or shifted by a random
amount from a private seed (`prep/mask.py`), and everything downstream is computed from the masked
rows. Without `NOF1_SEED` prep writes nothing public, and the build refuses to publish unless
`mask.json` and `meta.json` both say masked. Apps, record counts, dates and workout types are real.

Daily aggregates only. No raw readings, no timestamps finer than a day, no locations. Two sources
were dropped because their numbers did not add up (an HRV stream in the wrong units, two nights of
overlapping segments), and a "night" under one hour counts as no night. The prep code says where and why.

## Why

A founder posted that he was hiring an AI-native engineer who ships. This is the reply, built with
Claude Code in one sitting from data I already had. The method is real; the health values on the page are masked.
