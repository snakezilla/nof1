"""Mask the daily rows before anything is published. Stdlib only.

Each day's health values are multiplied or shifted three times: by a draw for that day
(random.Random(f"{seed}:{date}")), a draw for its month (f"{seed}:{yyyy-mm}") and one draw for the
whole year (f"{seed}:year"). The day draws hide single nights; the month and year draws move the
averages, so no real figure can be read back, not even a year's mean. Weekend and weekday nights
share the month and year draws, so comparisons between them still mean something. The same seed
always gives the same page. Dates, which days have data, and workout types stay real.

The seed comes from the NOF1_SEED environment variable (prep/run.sh reads it from ~/.nof1-seed).
Without it, nothing is written to web/public. The real values are written only by an explicit
--real run, and only to prep/private/, which git ignores.
"""
import json
import os
import random
from pathlib import Path
from typing import Mapping

HERE = Path(__file__).resolve().parent
WEB_DATA = HERE.parent / "web" / "public" / "data"
PRIVATE = HERE / "private"
SEED_ENV = "NOF1_SEED"

SLEEP_FACTOR = (0.85, 1.15)
BED_SHIFT_H = (-0.75, 0.75)
MINUTES_FACTOR = (0.7, 1.3)
HRV_FACTOR = (0.85, 1.15)
YEAR_SLEEP_FACTOR = (0.85, 1.15)
YEAR_BED_SHIFT_H = (-0.75, 0.75)
YEAR_MINUTES_FACTOR = (0.75, 1.25)
MONTH_SLEEP_FACTOR = (0.93, 1.07)
MONTH_BED_SHIFT_H = (-0.33, 0.33)

MASK_INFO = {
    "masked": True,
    "method": "each day's values are multiplied or shifted by random amounts drawn from a private seed: one per day, one per month and one for the whole year",
    "ranges": {"sleep": "x0.85 to x1.15 per day, x0.93 to x1.07 per month, x0.85 to x1.15 for the whole year",
               "bedtime": "plus or minus 45 min per day, 20 min per month, 45 min for the whole year",
               "awake and training minutes": "x0.7 to x1.3 per day, x0.75 to x1.25 for the whole year"},
    "real": ["which apps, what they wrote, record counts, dates", "which days have data", "workout types"],
}


def require_seed(env: Mapping[str, str] = os.environ) -> str:
    seed = env.get(SEED_ENV, "").strip()
    if not seed:
        raise SystemExit(f"{SEED_ENV} is not set, so no public file is written: the page must never show real values. "
                         "Run prep/run.sh (it reads the seed from ~/.nof1-seed), or pass --real to write to prep/private/ only.")
    return seed


def output_dir(real: bool, env: Mapping[str, str] = os.environ, public: Path = WEB_DATA, private: Path = PRIVATE) -> Path:
    """Where this run writes. The public folder needs the seed; a --real run goes to prep/private/ only."""
    folder = private if real else public
    if not real:
        require_seed(env)
    folder.mkdir(parents=True, exist_ok=True)
    if real:
        folder.chmod(0o700)
    return folder


def _scaled(value: float | None, factor: float, digits: int) -> float | None:
    return None if value is None else round(value * factor, digits)


def _minutes(value: int, factor: float) -> int:
    """0 stays 0, and a day with minutes keeps at least one, so which days have data stays real."""
    return 0 if not value else max(1, round(value * factor))


def year_shift(seed: str) -> dict:
    """One draw for the whole year, shared by every day."""
    rng = random.Random(f"{seed}:year")
    return {"sleep": rng.uniform(*YEAR_SLEEP_FACTOR), "bed": rng.uniform(*YEAR_BED_SHIFT_H), "minutes": rng.uniform(*YEAR_MINUTES_FACTOR)}


def month_shift(seed: str, month: str) -> dict:
    """One draw per calendar month ("2024-06"), shared by every day in it."""
    rng = random.Random(f"{seed}:{month}")
    return {"sleep": rng.uniform(*MONTH_SLEEP_FACTOR), "bed": rng.uniform(*MONTH_BED_SHIFT_H)}


def mask_row(row: dict, seed: str) -> dict:
    if not seed:
        raise ValueError("a seed is required")
    year, month = year_shift(seed), month_shift(seed, row["date"][:7])
    rng = random_for(seed, row["date"])
    # Every draw happens on every day, in a fixed order, so one field never shifts another's draw.
    day_sleep, day_bed = rng.uniform(*SLEEP_FACTOR), rng.uniform(*BED_SHIFT_H)
    awake_f, workout_f, mindful_f = rng.uniform(*MINUTES_FACTOR), rng.uniform(*MINUTES_FACTOR), rng.uniform(*MINUTES_FACTOR)
    hrv_f = rng.uniform(*HRV_FACTOR)
    sleep_f = day_sleep * month["sleep"] * year["sleep"]
    bed_shift = day_bed + month["bed"] + year["bed"]
    minutes_f = year["minutes"]
    awake = row.get("awake_min")
    bed = row.get("bed_h")
    return {
        **row,
        "sleep_h": _scaled(row["sleep_h"], sleep_f, 2),
        "deep_h": _scaled(row["deep_h"], sleep_f, 2),
        "rem_h": _scaled(row["rem_h"], sleep_f, 2),
        "bed_h": None if bed is None else round(bed + bed_shift, 2),
        "awake_min": None if awake is None else round(awake * awake_f * minutes_f),
        "workout_min": _minutes(row["workout_min"], workout_f * minutes_f),
        "mindful_min": _minutes(row["mindful_min"], mindful_f * minutes_f),
        "hrv_ms": _scaled(row["hrv_ms"], hrv_f, 1),
    }


def random_for(seed: str, day: str) -> random.Random:
    return random.Random(f"{seed}:{day}")


def mask_rows(rows: list[dict], seed: str) -> list[dict]:
    return [mask_row(r, seed) for r in rows]


def write_mask_info(folder: Path) -> None:
    (folder / "mask.json").write_text(json.dumps(MASK_INFO, indent=2, ensure_ascii=False))
