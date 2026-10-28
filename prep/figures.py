"""Precompute every figure on the page from daily.json, so the drawings and the words share one source.

Writes web/public/data/figures.json:
- stats: the four headline counts under the hero
- calendar: one cell per night of the year (week column, weekday row), with sleep, bedtime and training
- sleep_groups: every night's hours, grouped (weekend / weekday; after a short night / after 7 h+;
  after a training day / after a rest day), with mean, median, n and the share under 6 h
- bedtime: every night's bedtime as a decimal hour, by weekend / weekday, with medians
- typical_night: the median night from lights-out to wake, with awake minutes
- months: nights, median sleep and training minutes by type, per month
- claims: the three findings as a scored table (difference, interval, verdict)

Run after build.py and write_patterns.py: python3 figures.py. Public runs need NOF1_SEED and read
the masked rows; --real reads and writes prep/private/ only.
"""
import json
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from statistics import mean, median

import mask


def load(folder: Path) -> tuple[list[dict], list[dict]]:
    rows = json.loads((folder / "daily.json").read_text())
    patterns = json.loads((folder / "patterns.json").read_text())
    return rows, patterns


def is_weekend(day: str) -> bool:
    return date.fromisoformat(day).weekday() >= 5


def group(values: list[float], label: str) -> dict:
    v = sorted(values)
    return {"label": label, "n": len(v), "mean": round(mean(v), 2) if v else None, "median": round(median(v), 2) if v else None,
            "under_6": sum(1 for x in v if x < 6), "values": [round(x, 2) for x in v]}


def calendar(rows: list[dict]) -> dict:
    """Weeks run Monday to Sunday so the weekend sits in the bottom two rows of the grid."""
    first = date.fromisoformat(rows[0]["date"])
    start = first - timedelta(days=first.weekday())
    cells = []
    for r in rows:
        d = date.fromisoformat(r["date"])
        cells.append({"date": r["date"], "week": (d - start).days // 7, "weekday": d.weekday(),
                      "sleep_h": r["sleep_h"], "bed_h": r.get("bed_h"), "awake_min": r.get("awake_min"), "workout_min": r["workout_min"]})
    months = []
    seen = set()
    for r in rows:
        d = date.fromisoformat(r["date"])
        key = (d.year, d.month)
        if key not in seen and d.day <= 7:
            seen.add(key)
            months.append({"week": (d - start).days // 7, "label": d.strftime("%b")})
    return {"start": start.isoformat(), "weeks": (date.fromisoformat(rows[-1]["date"]) - start).days // 7 + 1, "cells": cells, "months": months}


def sleep_groups(rows: list[dict]) -> dict:
    nights = [r for r in rows if r["sleep_h"] is not None]
    pairs = list(zip(rows, rows[1:]))
    return {
        "weekend_vs_weekday": [group([r["sleep_h"] for r in nights if is_weekend(r["date"])], "weekend nights"),
                               group([r["sleep_h"] for r in nights if not is_weekend(r["date"])], "weekday nights")],
        "after_short_vs_long": [group([t["sleep_h"] for d, t in pairs if d["sleep_h"] is not None and d["sleep_h"] < 6 and t["sleep_h"] is not None], "night after a night under 6 h"),
                                group([t["sleep_h"] for d, t in pairs if d["sleep_h"] is not None and d["sleep_h"] >= 7 and t["sleep_h"] is not None], "night after 7 h or more")],
        "training_vs_rest": [group([t["sleep_h"] for d, t in pairs if d["workout_min"] >= 30 and t["sleep_h"] is not None], "night after a training day"),
                             group([t["sleep_h"] for d, t in pairs if d["workout_min"] == 0 and t["sleep_h"] is not None], "night after a rest day")],
    }


def bedtime(rows: list[dict]) -> dict:
    wk = [r["bed_h"] for r in rows if r.get("bed_h") is not None and is_weekend(r["date"])]
    wd = [r["bed_h"] for r in rows if r.get("bed_h") is not None and not is_weekend(r["date"])]
    return {"weekend": {"values": sorted(round(x, 2) for x in wk), "median": round(median(wk), 2), "n": len(wk)},
            "weekday": {"values": sorted(round(x, 2) for x in wd), "median": round(median(wd), 2), "n": len(wd)},
            "after_1am": sum(1 for x in wk + wd if x >= 25), "before_midnight": sum(1 for x in wk + wd if x < 24), "n": len(wk) + len(wd)}


def typical_night(rows: list[dict]) -> dict:
    nights = [r for r in rows if r["sleep_h"] is not None and r.get("bed_h") is not None and r.get("awake_min") is not None]
    bed = median(r["bed_h"] for r in nights)
    sleep = median(r["sleep_h"] for r in nights)
    awake = median(r["awake_min"] for r in nights)
    return {"bed_h": round(bed, 2), "sleep_h": round(sleep, 2), "awake_min": round(awake), "wake_h": round(bed + sleep + awake / 60, 2), "n": len(nights)}


def months(rows: list[dict]) -> list[dict]:
    by: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by[r["date"][:7]].append(r)
    out = []
    for key in sorted(by):
        rs = by[key]
        sleeps = [r["sleep_h"] for r in rs if r["sleep_h"] is not None]
        kinds: dict[str, int] = defaultdict(int)
        for r in rs:
            if r["workout_min"]:
                share = r["workout_min"] / max(1, len(r["workout_types"]))
                for t in (r["workout_types"] or ["other"]):
                    kinds[t] += round(share)
        out.append({"month": key, "label": date.fromisoformat(key + "-01").strftime("%b %y"), "nights": len(sleeps),
                    "median_sleep": round(median(sleeps), 2) if sleeps else None, "training_days": sum(1 for r in rs if r["workout_min"]),
                    "training_min": dict(sorted(kinds.items(), key=lambda kv: -kv[1]))})
    return out


def claims(patterns: list[dict]) -> list[dict]:
    out = []
    for p in patterns:
        hi = float(p["numbers"]["ci95"].split(" to ")[1].replace(" h", "").replace("+", ""))
        verdict = "holds" if hi < 0 else ("at the edge" if hi <= 0.05 else "not shown")
        out.append({"id": p["id"], "claim": p["title"], "a": p["numbers"]["a_value"], "b": p["numbers"]["b_value"], "n": f'{p["numbers"]["n_a"]} / {p["numbers"]["n_b"]}',
                    "difference": p["numbers"]["diff"], "interval": p["numbers"]["ci95"], "verdict": verdict})
    return out


def stats(rows: list[dict]) -> list[dict]:
    nights = [r for r in rows if r["sleep_h"] is not None]
    return [
        {"value": str(len(nights)), "label": "nights with a reading"},
        {"value": f"{median(r['sleep_h'] for r in nights):.1f} h", "label": "median night"},
        {"value": str(sum(1 for r in nights if r["sleep_h"] < 6)), "label": "nights under 6 h"},
        {"value": str(sum(1 for r in rows if r["workout_min"])), "label": "training days"},
    ]


def main(real: bool) -> None:
    out = mask.output_dir(real)
    rows, patterns = load(out)
    fig = {"stats": stats(rows), "calendar": calendar(rows), "sleep_groups": sleep_groups(rows), "bedtime": bedtime(rows),
           "typical_night": typical_night(rows), "months": months(rows), "claims": claims(patterns)}
    (out / "figures.json").write_text(json.dumps(fig, separators=(",", ":")))
    print("wrote figures.json:", {k: (len(v) if isinstance(v, list) else "ok") for k, v in fig.items()})
    print("typical night:", fig["typical_night"]); print("stats:", [s["value"] for s in fig["stats"]])
    print("claims:", [(c["claim"], c["verdict"]) for c in fig["claims"]])


if __name__ == "__main__":
    main("--real" in sys.argv)
