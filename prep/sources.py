"""Inventory every app and device that wrote records into Apple Health. Stdlib only.

Reads every event CSV and every raw HealthKit JSONL batch, joins them on the sample UUID (the
raw batches repeat samples across syncs, and the CSVs hold records the raw batches miss, such as
WHOOP workouts), and counts records per source. Only names, record types, counts and dates leave
this module: never values, locations or routes.

Usage: python3 sources.py   (prints a one-line-per-source summary)
"""
import csv
import json
from datetime import date
from pathlib import Path

import load

RAW = load.EVENTS.parent / "raw"
WINDOW = (date(2024, 5, 1), date(2025, 4, 30))

DISPLAY_NAMES = {
    "Ahsan’s Apple Watch": "Apple Watch",
    "AE’s iPhone 13 Pro": "iPhone (motion sensors, with AirPods for headphone levels)",
    "Connect": "Garmin Connect",
    "WHM": "Wim Hof Method",
    "VeSyncFit": "VeSync (smart scale)",
    "VeSync": "VeSync (smart scale, newer app)",
    "Unstrap": "Unstrap (open-source WHOOP Bluetooth reader)",
    "ECG": "ECG app on Apple Watch",
    "Balance": "Balance (meditation app)",
    "Unwind": "Unwind (unknown app)",
    "WHOOP": "WHOOP",
    "Strava": "Strava",
    "SnoreLab": "SnoreLab",
    "Nike Run Club": "Nike Run Club",
}

# One plain word or phrase per HealthKit type, so the page never shows an identifier.
TYPE_NAMES = {
    "HKCategoryTypeIdentifierSleepAnalysis": "sleep",
    "HKCategoryTypeIdentifierMindfulSession": "mindful minutes",
    "HKCategoryTypeIdentifierAppleStandHour": "stand hours",
    "HKCategoryTypeIdentifierHighHeartRateEvent": "high heart rate alerts",
    "HKDataTypeIdentifierHeartbeatSeries": "heartbeat series",
    "HKDataTypeIdentifierElectrocardiogram": "ECG",
    "HKWorkoutTypeIdentifier": "workouts",
    "HKWorkoutRouteTypeIdentifier": "routes",
    "HKQuantityTypeIdentifierHeartRate": "heart rate",
    "HKQuantityTypeIdentifierRestingHeartRate": "resting heart rate",
    "HKQuantityTypeIdentifierWalkingHeartRateAverage": "walking heart rate",
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN": "HRV",
    "HKQuantityTypeIdentifierOxygenSaturation": "blood oxygen",
    "HKQuantityTypeIdentifierRespiratoryRate": "breathing rate",
    "HKQuantityTypeIdentifierBodyMass": "weight",
    "HKQuantityTypeIdentifierBodyFatPercentage": "body fat",
    "HKQuantityTypeIdentifierBodyMassIndex": "BMI",
    "HKQuantityTypeIdentifierLeanBodyMass": "lean mass",
    "HKQuantityTypeIdentifierHeight": "height",
    "HKQuantityTypeIdentifierStepCount": "steps",
    "HKQuantityTypeIdentifierDistanceWalkingRunning": "walking distance",
    "HKQuantityTypeIdentifierDistanceCycling": "cycling distance",
    "HKQuantityTypeIdentifierFlightsClimbed": "flights climbed",
    "HKQuantityTypeIdentifierWalkingSpeed": "walking speed",
    "HKQuantityTypeIdentifierWalkingStepLength": "step length",
    "HKQuantityTypeIdentifierWalkingAsymmetryPercentage": "walking asymmetry",
    "HKQuantityTypeIdentifierWalkingDoubleSupportPercentage": "double support time",
    "HKQuantityTypeIdentifierAppleWalkingSteadiness": "walking steadiness",
    "HKQuantityTypeIdentifierHeadphoneAudioExposure": "headphone audio levels",
    "HKQuantityTypeIdentifierActiveEnergyBurned": "active energy",
    "HKQuantityTypeIdentifierBasalEnergyBurned": "resting energy",
    "HKQuantityTypeIdentifierAppleExerciseTime": "exercise minutes",
    "HKQuantityTypeIdentifierAppleStandTime": "stand minutes",
    # older batches name the type with a short metric name instead
    "sleep_analysis": "sleep", "workout": "workouts", "resting_heart_rate": "resting heart rate",
    "heart_rate_variability_sdnn": "HRV", "body_mass": "weight", "steps": "steps",
    "walking_running_distance": "walking distance", "active_energy_burned": "active energy",
}
CSV_TYPES = {
    "sleep.csv": "sleep", "workouts.csv": "workouts", "hrv.csv": "HRV", "mindfulness.csv": "mindful minutes",
    "stand_hours.csv": "stand hours", "workout_routes.csv": "routes", "ecg.csv": "ECG",
    "heartbeat_series.csv": "heartbeat series", "high_heart_rate_event.csv": "high heart rate alerts",
}

USED = {"WHOOP": "used: sleep and workouts", "Strava": "used: workouts", "SnoreLab": "used: sleep",
        "Balance": "not used: mindful minutes on 19 days, too few to show"}
EXCLUDED = {"Unstrap": "excluded: HRV is not SDNN in milliseconds, sleep segments overlap"}
NOT_USED_WHY = {
    "AE’s iPhone 13 Pro": "not used: steps and gait, not studied",
    "Connect": "not used: Garmin heart rate, not studied",
    "VeSyncFit": "not used: body composition, not studied",
    "VeSync": "not used: body composition, not studied",
}


def _clean(name: str) -> str:
    return name.replace("\xa0", " ").strip()


def _records() -> dict[str, dict]:
    """Every record once, keyed by its sample UUID: {uuid: {source, type, start}}."""
    return scan()[0]


def scan() -> tuple[dict[str, dict], dict]:
    """Every record once, keyed by its sample UUID, and the counts of the join: how many lines the
    raw batches hold and how many of them repeat a sample an earlier batch already had."""
    out: dict[str, dict] = {}
    lines = repeats = 0
    for path in sorted(RAW.rglob("*.jsonl")):
        try:
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    lines += 1
                    r = json.loads(line)
                    if r.get("deleted") or not r.get("sampleUUID") or not r.get("startAt"):
                        continue
                    if r["sampleUUID"] in out:
                        repeats += 1
                        continue
                    kind = r.get("sampleTypeIdentifier") or r.get("metricType") or "unknown"
                    out.setdefault(r["sampleUUID"], {"source": _clean(r.get("sourceApp", "unknown")),
                                                     "type": TYPE_NAMES.get(kind, kind), "start": r["startAt"]})
        except (OSError, json.JSONDecodeError) as e:
            raise SystemExit(f"cannot read {path}: {e}") from e
    for name, kind in CSV_TYPES.items():
        for r in load._rows(name):
            if r.get("uuid") and r.get("start"):
                out.setdefault(r["uuid"], {"source": _clean(r.get("source", "unknown")), "type": kind, "start": r["start"]})
    return out, {"raw_lines": lines, "repeats": repeats, "records": len(out)}


def _status(source: str, in_window: int) -> str:
    if source in USED:
        return USED[source]
    if source in EXCLUDED:
        return EXCLUDED[source]
    if in_window == 0:
        return "outside the window"
    return NOT_USED_WHY.get(source, "not used: not part of this study")


def all_sources(records: dict[str, dict] | None = None) -> list[dict]:
    """One row per source app or device, used first, then by record count."""
    by_source: dict[str, list] = {}
    for rec in (records if records is not None else _records()).values():
        try:
            day = load._local(rec["start"]).date()
        except ValueError:
            continue  # a malformed timestamp is dropped, never guessed
        by_source.setdefault(rec["source"], []).append((day, rec["type"]))
    rows = []
    for source, items in by_source.items():
        days = [d for d, _ in items]
        type_counts: dict[str, int] = {}
        for _, kind in items:
            type_counts[kind] = type_counts.get(kind, 0) + 1
        in_window = sum(1 for d in days if WINDOW[0] <= d <= WINDOW[1])
        rows.append({
            "app": DISPLAY_NAMES.get(source, f"{source} (unknown app)"),
            "record_types": sorted(type_counts, key=lambda k: -type_counts[k]),
            "records": len(items),
            "first": min(days).isoformat(),
            "last": max(days).isoformat(),
            "in_window": in_window,
            "status": _status(source, in_window),
        })
    return sorted(rows, key=lambda r: (not r["status"].startswith("used"), -r["records"]))


if __name__ == "__main__":
    for r in all_sources():
        print(f'{r["app"]}: {r["records"]} records ({r["in_window"]} in window), {r["first"]} to {r["last"]}, '
              f'{", ".join(r["record_types"])}; {r["status"]}')
