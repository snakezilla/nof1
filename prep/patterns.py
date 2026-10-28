"""Candidate patterns from the daily rows, with the numbers that back them.

Every comparison returns means, medians and counts for two groups, plus a bootstrap 95%
interval on the difference in means, so the site can show numbers rather than adjectives.
"""
import random
from statistics import mean, median


def _ci(a: list[float], b: list[float], rounds: int = 2000, seed: int = 7) -> tuple[float, float]:
    rng = random.Random(seed)
    diffs = sorted(mean(rng.choices(a, k=len(a))) - mean(rng.choices(b, k=len(b))) for _ in range(rounds))
    return round(diffs[int(0.025 * rounds)], 1), round(diffs[int(0.975 * rounds)], 1)


def compare(a: list[float], b: list[float]) -> dict:
    if len(a) < 10 or len(b) < 10:
        return {"n_a": len(a), "n_b": len(b), "enough": False}
    lo, hi = _ci(a, b)
    return {"mean_a": round(mean(a), 1), "mean_b": round(mean(b), 1), "median_a": round(median(a), 1), "median_b": round(median(b), 1),
            "n_a": len(a), "n_b": len(b), "diff": round(mean(a) - mean(b), 1), "ci95": [lo, hi], "enough": True}


def _pairs(rows: list[dict]) -> list[tuple[dict, dict]]:
    """(today, tomorrow) pairs, for next-day effects."""
    return list(zip(rows, rows[1:]))


def short_sleep_vs_hrv(rows: list[dict]) -> dict:
    """Night under 6 h vs 7 h or more, against the same morning's HRV."""
    short = [r["hrv_ms"] for r in rows if r["sleep_h"] is not None and r["sleep_h"] < 6 and r["hrv_ms"] is not None]
    long_ = [r["hrv_ms"] for r in rows if r["sleep_h"] is not None and r["sleep_h"] >= 7 and r["hrv_ms"] is not None]
    return {"id": "short-sleep-hrv", **compare(short, long_)}


def workout_vs_next_hrv(rows: list[dict]) -> dict:
    """Days with 30+ workout minutes vs none, against next morning's HRV."""
    a = [t["hrv_ms"] for d, t in _pairs(rows) if d["workout_min"] >= 30 and t["hrv_ms"] is not None]
    b = [t["hrv_ms"] for d, t in _pairs(rows) if d["workout_min"] == 0 and t["hrv_ms"] is not None]
    return {"id": "workout-next-hrv", **compare(a, b)}


def workout_vs_sleep(rows: list[dict]) -> dict:
    """Days with 30+ workout minutes vs none, against that night's sleep (recorded next morning)."""
    a = [t["sleep_h"] for d, t in _pairs(rows) if d["workout_min"] >= 30 and t["sleep_h"] is not None]
    b = [t["sleep_h"] for d, t in _pairs(rows) if d["workout_min"] == 0 and t["sleep_h"] is not None]
    return {"id": "workout-sleep", **compare(a, b)}


def weekend_vs_weekday_sleep(rows: list[dict]) -> dict:
    from datetime import date
    wk = [r["sleep_h"] for r in rows if r["sleep_h"] is not None and date.fromisoformat(r["date"]).weekday() in (5, 6)]
    wd = [r["sleep_h"] for r in rows if r["sleep_h"] is not None and date.fromisoformat(r["date"]).weekday() < 5]
    return {"id": "weekend-sleep", **compare(wk, wd)}


def mindful_vs_next_hrv(rows: list[dict]) -> dict:
    a = [t["hrv_ms"] for d, t in _pairs(rows) if d["mindful_min"] > 0 and t["hrv_ms"] is not None]
    b = [t["hrv_ms"] for d, t in _pairs(rows) if d["mindful_min"] == 0 and t["hrv_ms"] is not None]
    return {"id": "mindful-next-hrv", **compare(a, b)}


def yearly(rows: list[dict]) -> dict:
    out = {}
    for y in sorted({r["date"][:4] for r in rows}):
        h = [r["hrv_ms"] for r in rows if r["date"].startswith(y) and r["hrv_ms"] is not None]
        s = [r["sleep_h"] for r in rows if r["date"].startswith(y) and r["sleep_h"] is not None]
        w = [r["workout_min"] for r in rows if r["date"].startswith(y)]
        out[y] = {"hrv_median": round(median(h), 1) if h else None, "hrv_days": len(h), "sleep_median": round(median(s), 2) if s else None,
                  "sleep_days": len(s), "workout_days": sum(1 for x in w if x > 0), "days": len(w)}
    return out


def rebound_after_short_night(rows: list[dict]) -> dict:
    """The night after a night under 6 h vs the night after 7 h or more."""
    a = [t["sleep_h"] for d, t in _pairs(rows) if d["sleep_h"] is not None and d["sleep_h"] < 6 and t["sleep_h"] is not None]
    b = [t["sleep_h"] for d, t in _pairs(rows) if d["sleep_h"] is not None and d["sleep_h"] >= 7 and t["sleep_h"] is not None]
    return {"id": "rebound", **compare(a, b)}


def late_bedtime_vs_sleep(rows: list[dict]) -> dict:
    """Asleep after 1 am vs before midnight, against that night's hours."""
    late = [r["sleep_h"] for r in rows if r.get("bed_h") is not None and r["bed_h"] >= 25 and r["sleep_h"] is not None]
    early = [r["sleep_h"] for r in rows if r.get("bed_h") is not None and r["bed_h"] < 24 and r["sleep_h"] is not None]
    return {"id": "late-bedtime", **compare(late, early)}


def late_bedtime_vs_awake(rows: list[dict]) -> dict:
    """Asleep after 1 am vs before midnight, against minutes awake during the night."""
    late = [float(r["awake_min"]) for r in rows if r.get("bed_h") is not None and r["bed_h"] >= 25 and r.get("awake_min") is not None]
    early = [float(r["awake_min"]) for r in rows if r.get("bed_h") is not None and r["bed_h"] < 24 and r.get("awake_min") is not None]
    return {"id": "late-bedtime-awake", **compare(late, early)}


def bedtime_spread(rows: list[dict]) -> dict:
    """How much the bedtime moves: share of nights before midnight, after 1 am, and the quartiles."""
    beds = sorted(r["bed_h"] for r in rows if r.get("bed_h") is not None)
    if len(beds) < 10:
        return {"n": len(beds), "enough": False}
    q = lambda p: round(beds[int(p * (len(beds) - 1))], 2)
    return {"n": len(beds), "before_midnight": sum(1 for b in beds if b < 24), "after_1am": sum(1 for b in beds if b >= 25),
            "q25": q(0.25), "median": q(0.5), "q75": q(0.75), "enough": True}


def all_candidates(rows: list[dict]) -> dict:
    return {"short_sleep_vs_hrv": short_sleep_vs_hrv(rows), "workout_vs_next_hrv": workout_vs_next_hrv(rows), "workout_vs_sleep": workout_vs_sleep(rows),
            "weekend_vs_weekday_sleep": weekend_vs_weekday_sleep(rows), "mindful_vs_next_hrv": mindful_vs_next_hrv(rows),
            "rebound_after_short_night": rebound_after_short_night(rows), "late_bedtime_vs_sleep": late_bedtime_vs_sleep(rows),
            "late_bedtime_vs_awake": late_bedtime_vs_awake(rows), "bedtime_spread": bedtime_spread(rows), "yearly": yearly(rows)}
