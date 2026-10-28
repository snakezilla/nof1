"""Build daily.json, meta.json and mask.json, and print the candidate patterns.

The daily rows are masked (mask.py) before anything downstream sees them, so every published
number is computed from masked rows only.

Usage: NOF1_SEED=... python3 build.py   (masked; writes web/public/data/; prep/run.sh sets the seed)
       python3 build.py --real          (real values; writes prep/private/ only, never web/public)
       python3 build.py --dry-run       (prints only)
"""
import json
import sys
from datetime import date
from pathlib import Path

import load
import mask
import sources as source_inventory
from daily import build_daily
from patterns import all_candidates

HERE = Path(__file__).resolve().parent
REPO = "https://github.com/snakezilla/nof1"
FIRST_DAY = date(2024, 5, 1)  # nightly sleep data starts here; earlier years hold only scattered workouts
LAST_DAY = date(2025, 4, 30)  # and ends here; a few 2026 workouts after a year of nothing would only stretch the charts
TAGLINE = "A year of nights and training days, one experiment at a time."
SOURCE_NAMES = {"Ahsan’s Apple Watch": "Apple Watch", "Connect": "Garmin Connect"}


def provenance_block(sleep: list[dict], workouts: list[dict], hrv: list[dict], first: date, last: date) -> dict:
    """Which app wrote each kind of record into Apple Health inside the window, and what was left out.
    This is the data behind the "Where the data comes from" section, so the page cannot overstate it."""
    def inside(d: date) -> bool:
        return first <= d <= last
    nights_by_app: dict[str, set] = {}
    for r in sleep:
        if inside(r["end"].date()):
            nights_by_app.setdefault(SOURCE_NAMES.get(r["source"], r["source"]), set()).add(r["end"].date())
    workouts_by_app: dict[str, int] = {}
    for r in workouts:
        if inside(r["start"].date()):
            app = SOURCE_NAMES.get(r.get("app", "unknown"), r.get("app", "unknown"))
            workouts_by_app[app] = workouts_by_app.get(app, 0) + 1
    # Counts of what was left out come from the raw CSV, since load.hrv() already drops the Unstrap rows.
    raw_hrv = load._rows("hrv.csv")
    unstrap_rows = sum(1 for r in raw_hrv if r.get("source") == "Unstrap")
    watch_rows = sum(1 for r in raw_hrv if "Watch" in r.get("source", ""))
    return {
        "hub": "Apple Health (HealthKit) on my iPhone",
        "exporter": "HealthExporter, my own iOS app: anchored HealthKit queries, lifetime backfill, JSONL and CSV to an iCloud Documents container, run on launch, from an iOS Shortcut at 2:05 am and 2:05 pm, and on HealthKit observer callbacks",
        "nights_by_app": {k: len(v) for k, v in sorted(nights_by_app.items(), key=lambda kv: -len(kv[1]))},
        "workouts_by_app": dict(sorted(workouts_by_app.items(), key=lambda kv: -kv[1])),
        "excluded": [
            {"what": "Unstrap HRV stream", "rows": unstrap_rows, "why": "read straight from the strap over Bluetooth by an open-source tool; its HRV figures are not SDNN in milliseconds, so they are not comparable"},
            {"what": "Unstrap sleep segments", "rows": 2, "why": "two 2026 nights of overlapping segments that do not add up to a night"},
            {"what": "nights under 1 hour", "rows": 6, "why": "naps or partial syncs, not nights"},
            {"what": "Apple Watch HRV", "rows": watch_rows, "why": "30 readings from 2022, outside the window"},
        ],
        "window": {"from": first.isoformat(), "to": last.isoformat()},
    }


def fusion_block(counts: dict, days: int) -> dict:
    """How the streams were joined: the counts behind the "Joining it" list on the page."""
    return {**counts, "dropped_streams": 1, "days": days}


def main(dry_run: bool, real: bool) -> None:
    out = None if dry_run else mask.output_dir(real)  # refuses before any work when a public run has no seed
    hrv, sleep, workouts, mindfulness = load.hrv(), load.sleep(), load.workouts(), load.mindfulness()
    rows = build_daily(hrv, sleep, workouts, mindfulness, first_day=FIRST_DAY, last_day=LAST_DAY)
    if not rows:
        raise SystemExit("no data found")
    if not real:
        rows = mask.mask_rows(rows, mask.require_seed())
    nights = sum(1 for r in rows if r["sleep_h"] is not None)
    records, counts = source_inventory.scan()
    provenance = provenance_block(sleep, workouts, hrv, FIRST_DAY, LAST_DAY)
    provenance = {**provenance, "all_sources": source_inventory.all_sources(records), "fusion": fusion_block(counts, len(rows))}
    sources = sorted(set(provenance["nights_by_app"]) | set(provenance["workouts_by_app"]))
    meta = {"range": {"from": rows[0]["date"], "to": rows[-1]["date"]}, "days": len(rows), "nights": nights, "provenance": provenance,
            "days_with_data": sum(1 for r in rows if r["hrv_ms"] is not None or r["sleep_h"] is not None or r["workout_min"] or r["mindful_min"]),
            "workout_days": sum(1 for r in rows if r["workout_min"]), "tagline": TAGLINE, "masked": not real,
            "sources": sources, "built": date.today().isoformat(), "repo": REPO}
    candidates = all_candidates(rows)
    print(json.dumps({"meta": {k: v for k, v in meta.items() if k != "provenance"}, "candidates": candidates}, indent=1))
    if out is None:
        return
    (out / "daily.json").write_text(json.dumps(rows, separators=(",", ":")))
    (out / "meta.json").write_text(json.dumps(meta, indent=2))
    (out / "candidates.json" if real else HERE / "candidates.json").write_text(json.dumps(candidates, indent=1))
    if not real:
        mask.write_mask_info(out)
    print(f"wrote {out / 'daily.json'} ({len(rows)} days), meta.json{'' if real else ', mask.json'}", file=sys.stderr)


if __name__ == "__main__":
    main("--dry-run" in sys.argv, "--real" in sys.argv)
