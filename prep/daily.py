"""Turn event records into one row per calendar day (the daily.json contract).

Rules:
- HRV: median of the day's readings across sources, with the count behind it.
- Sleep: a night belongs to the morning it ends. Per night, one source wins: the one with the
  most asleep minutes (stage codes 1, 3, 4, 5). If no source has asleep stages, in-bed time
  from the best in-bed source is used instead. Deep and REM are null unless that source has stages.
- Workouts and mindfulness: summed minutes on the day they started.
"""
from collections import defaultdict
from datetime import date, timedelta
from statistics import median

from load import ASLEEP_CODES, AWAKE, DEEP, IN_BED, REM


def _hrv_by_day(records: list[dict]) -> dict[date, list[float]]:
    out: dict[date, list[float]] = defaultdict(list)
    for r in records:
        out[r["start"].date()].append(r["value"])
    return out


def _sleep_by_night(records: list[dict]) -> dict[date, dict]:
    """night -> {source -> {"asleep": min, "in_bed": min, "deep": min, "rem": min, "staged": bool}}"""
    def blank() -> dict:
        return {"asleep": 0.0, "in_bed": 0.0, "awake": 0.0, "deep": 0.0, "rem": 0.0, "staged": False, "first": None}

    nights: dict[date, dict[str, dict]] = defaultdict(lambda: defaultdict(blank))
    for r in records:
        minutes = (r["end"] - r["start"]).total_seconds() / 60
        if minutes <= 0 or minutes > 20 * 60:
            continue  # an open-ended or broken segment is ignored
        night = r["end"].date()
        s = nights[night][r["source"]]
        if r["code"] in ASLEEP_CODES:
            s["asleep"] += minutes
            s["first"] = r["start"] if s["first"] is None or r["start"] < s["first"] else s["first"]
        if r["code"] == IN_BED:
            s["in_bed"] += minutes
        if r["code"] == AWAKE:
            s["awake"] += minutes
        if r["code"] == DEEP:
            s["deep"] += minutes
            s["staged"] = True
        if r["code"] == REM:
            s["rem"] += minutes
            s["staged"] = True
    return {night: _pick_source(by_source) for night, by_source in nights.items()}


def _bed_hour(first) -> float | None:
    """Bedtime as a decimal hour on a 24 h clock that runs past midnight: 23.5 = 11:30 pm, 25.0 = 1:00 am."""
    if first is None:
        return None
    h = first.hour + first.minute / 60
    return round(h + 24 if h < 12 else h, 2)


def _pick_source(by_source: dict[str, dict]) -> dict:
    best = max(by_source.values(), key=lambda s: (s["asleep"], s["in_bed"]))
    hours = best["asleep"] if best["asleep"] > 0 else best["in_bed"]
    if hours < 60 or hours > 14 * 60:
        return {}  # under an hour is a nap or a partial sync, over 14 h is overlapping segments; neither is a night
    return {
        "sleep_h": round(hours / 60, 2),
        "deep_h": round(best["deep"] / 60, 2) if best["staged"] else None,
        "rem_h": round(best["rem"] / 60, 2) if best["staged"] else None,
        "awake_min": round(best["awake"]) if best["asleep"] > 0 else None,
        "bed_h": _bed_hour(best["first"]),
    }


def _minutes_by_day(records: list[dict]) -> dict[date, float]:
    out: dict[date, float] = defaultdict(float)
    for r in records:
        out[r["start"].date()] += r["minutes"]
    return out


def _types_by_day(records: list[dict]) -> dict[date, list[str]]:
    out: dict[date, list[str]] = defaultdict(list)
    for r in records:
        if r["type"] not in out[r["start"].date()]:
            out[r["start"].date()] = [*out[r["start"].date()], r["type"]]
    return out


def build_daily(hrv: list[dict], sleep: list[dict], workouts: list[dict], mindfulness: list[dict],
                last_day: date | None = None, first_day: date | None = None) -> list[dict]:
    hrv_days, nights = _hrv_by_day(hrv), _sleep_by_night(sleep)
    wk_min, wk_types, mind_min = _minutes_by_day(workouts), _types_by_day(workouts), _minutes_by_day(mindfulness)
    all_days = [*hrv_days, *nights, *wk_min, *mind_min]
    if not all_days:
        return []
    first, last = first_day or min(all_days), last_day or max(all_days)
    rows = []
    day = first
    while day <= last:
        h = hrv_days.get(day, [])
        n = nights.get(day, {})
        rows.append({
            "date": day.isoformat(),
            "hrv_ms": round(median(h), 1) if h else None,
            "hrv_n": len(h),
            "sleep_h": n.get("sleep_h"),
            "deep_h": n.get("deep_h"),
            "rem_h": n.get("rem_h"),
            "awake_min": n.get("awake_min"),
            "bed_h": n.get("bed_h"),
            "workout_min": round(wk_min.get(day, 0.0)),
            "workout_types": wk_types.get(day, []),
            "mindful_min": round(mind_min.get(day, 0.0)),
        })
        day += timedelta(days=1)
    return rows
