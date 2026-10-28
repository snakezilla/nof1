"""Read the HealthExporter event CSVs into plain records. Stdlib only.

Each reader yields dicts with local (America/Toronto) start and end datetimes, so a night
of sleep lands on the morning it ends and an evening workout lands on the day it happened.
"""
import csv
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

EVENTS = Path.home() / ".openwhoop" / "apple_health_data" / "events"
LOCAL = ZoneInfo("America/Toronto")

# HKCategoryValueSleepAnalysis codes
IN_BED, ASLEEP, AWAKE, CORE, DEEP, REM = 0, 1, 2, 3, 4, 5
ASLEEP_CODES = {ASLEEP, CORE, DEEP, REM}


def _local(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(LOCAL)


def _rows(name: str, folder: Path = EVENTS) -> list[dict]:
    path = folder / name
    try:
        with open(path, newline="", encoding="utf-8") as f:
            return list(csv.DictReader(f))
    except OSError as e:
        raise SystemExit(f"cannot read {path}: {e}") from e


# Unstrap writes an HRV figure every few minutes on a scale that is not SDNN in
# milliseconds. Those 20,000 rows are left out rather than shown as if they were comparable.
HRV_SOURCES_IGNORED = {"Unstrap"}


def hrv(folder: Path = EVENTS) -> list[dict]:
    out = []
    for r in _rows("hrv.csv", folder):
        try:
            if r["source"] in HRV_SOURCES_IGNORED:
                continue
            out.append({"start": _local(r["start"]), "value": float(r["value"]), "source": r["source"]})
        except (ValueError, KeyError):
            continue  # a malformed row is dropped, never guessed
    return out


# Unstrap's two 2026 nights are overlapping segments that do not add up to a night. Left out.
SLEEP_SOURCES_IGNORED = {"Unstrap"}


def sleep(folder: Path = EVENTS) -> list[dict]:
    """Sleep segments, de-duplicated, from the sources whose nights add up."""
    out, seen = [], set()
    for r in _rows("sleep.csv", folder):
        try:
            key = (r["start"], r["end"], r["value"], r["source"])
            if key in seen or r["source"] in SLEEP_SOURCES_IGNORED:
                continue
            seen.add(key)
            out.append({"start": _local(r["start"]), "end": _local(r["end"]), "code": int(float(r["value"])), "source": r["source"]})
        except (ValueError, KeyError):
            continue
    return out


def workouts(folder: Path = EVENTS) -> list[dict]:
    out = []
    for r in _rows("workouts.csv", folder):
        try:
            out.append({"start": _local(r["start"]), "minutes": float(r["duration_s"]) / 60, "type": r["type"] or "other", "app": r.get("source", "unknown")})
        except (ValueError, KeyError):
            continue
    return out


def mindfulness(folder: Path = EVENTS) -> list[dict]:
    out = []
    for r in _rows("mindfulness.csv", folder):
        try:
            s, e = _local(r["start"]), _local(r["end"])
            out.append({"start": s, "minutes": (e - s).total_seconds() / 60})
        except (ValueError, KeyError):
            continue
    return out
