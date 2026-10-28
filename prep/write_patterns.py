"""Write patterns.json and test.json from the computed numbers, so the words can never drift
from the data. Run after build.py (which writes candidates.json and daily.json).
Public runs need NOF1_SEED and read the masked rows; --real reads and writes prep/private/ only.
"""
import json
import sys
from datetime import date
from pathlib import Path
from statistics import mean, median

import mask

HERE = Path(__file__).resolve().parent
WINDOW = "May 2024 to Apr 2025"


def h(x: float) -> str:
    return f"{x:.1f} h"


def clock(bed_h: float) -> str:
    hh, mm = int(bed_h) % 24, int(round((bed_h % 1) * 60))
    suffix = "am" if hh < 12 else "pm"
    return f"{(hh % 12) or 12}:{mm:02d} {suffix}"


def weekend_stats(rows: list[dict]) -> dict:
    nights = [r for r in rows if r["sleep_h"] is not None]
    wk = [r for r in nights if date.fromisoformat(r["date"]).weekday() in (5, 6)]
    wd = [r for r in nights if date.fromisoformat(r["date"]).weekday() < 5]
    return {
        "wk_under6": sum(1 for r in wk if r["sleep_h"] < 6), "wd_under6": sum(1 for r in wd if r["sleep_h"] < 6),
        "wk_bed": median(r["bed_h"] for r in wk if r["bed_h"] is not None), "wd_bed": median(r["bed_h"] for r in wd if r["bed_h"] is not None),
        "wk_mean": round(mean(r["sleep_h"] for r in wk), 1), "wd_mean": round(mean(r["sleep_h"] for r in wd), 1),
    }


def patterns(c: dict, s: dict) -> list[dict]:
    w, r, t = c["weekend_vs_weekday_sleep"], c["rebound_after_short_night"], c["workout_vs_sleep"]
    ci = lambda x: f"{x['ci95'][0]:+.1f} to {x['ci95'][1]:+.1f} h"
    return [
        {"id": "weekend-sleep", "title": "Weekends cost me sleep",
         "finding": f"On Saturday and Sunday mornings I had slept {h(w['mean_a'])} on average, against {h(w['mean_b'])} on weekdays. "
                    f"{s['wk_under6']} of {w['n_a']} weekend nights were under 6 h; on weekdays it was {s['wd_under6']} of {w['n_b']}.",
         "numbers": {"a_label": "weekend nights", "a_value": h(w["mean_a"]), "b_label": "weekday nights", "b_value": h(w["mean_b"]),
                     "n_a": w["n_a"], "n_b": w["n_b"], "window": WINDOW, "diff": f"{w['diff']:+.1f} h", "ci95": ci(w)},
         "caveat": "Observational. Weekends also hold the late dinners and the travel, so the weekend is a bundle, not one cause."},
        {"id": "rebound", "title": "I do not catch up the next night",
         "finding": f"After a night under 6 h, the next night averaged {h(r['mean_a'])}. After a night of 7 h or more, {h(r['mean_b'])}. "
                    "Short nights came in runs instead of being repaid.",
         "numbers": {"a_label": "night after a short night", "a_value": h(r["mean_a"]), "b_label": "night after 7 h or more", "b_value": h(r["mean_b"]),
                     "n_a": r["n_a"], "n_b": r["n_b"], "window": WINDOW, "diff": f"{r['diff']:+.1f} h", "ci95": ci(r)},
         "caveat": (f"The interval ({ci(r)}) stays below zero, but it rests on {r['n_a']} short nights, so treat it as likely, not settled."
                    if r["ci95"][1] < 0 else f"The interval on that gap touches zero ({ci(r)}), so treat it as likely, not settled.")},
        {"id": "workout-sleep",
         "title": "Training days do not cost sleep" if t["ci95"][1] > 0 else "Training days cost little sleep, if any",
         "finding": f"Nights after a day with 30 or more minutes of training averaged {h(t['mean_a'])}; nights after a rest day, {h(t['mean_b'])}. "
                    + (f"The gap is {t['diff']:+.1f} h and its interval ({ci(t)}) includes zero." if t["ci95"][1] > 0
                       else f"The gap is {t['diff']:+.1f} h and its interval ({ci(t)}) just touches zero."),
         "numbers": {"a_label": "after a training day", "a_value": h(t["mean_a"]), "b_label": "after a rest day", "b_value": h(t["mean_b"]),
                     "n_a": t["n_a"], "n_b": t["n_b"], "window": WINDOW, "diff": f"{t['diff']:+.1f} h", "ci95": ci(t)},
         "caveat": ("A null result is still a result. It rules out the \"I slept badly because I trained\" story, for me." if t["ci95"][1] > 0
                    else "At the edge of what one year of nights can tell apart. Evening sessions and late finishes sit in the training group, so the timing may matter more than the training.")},
    ]


def test(s: dict) -> dict:
    return {
        "id": "weekend-wake", "pattern_id": "weekend-sleep", "duration_days": 14,
        "title": "Two weeks of weekday wake-ups on the weekend",
        "hypothesis": f"If I get up within 30 minutes of my weekday time on Saturday and Sunday, weekend sleep moves from {h(s['wk_mean'])} toward the weekday {h(s['wd_mean'])}. "
                      f"Bedtimes differ by about {round((s['wk_bed'] - s['wd_bed']) * 60)} minutes (median {clock(s['wk_bed'])} on weekends, {clock(s['wd_bed'])} on weekdays), "
                      f"so most of the missing time is at the morning end, which is the end a wake-up rule controls.",
        "why": "It targets the clearest effect that one simple rule can reach, and it costs nothing to run.",
        "protocol": ["Weekday alarm time on Saturday and Sunday, within 30 minutes", "Lights out by 12:30 on Friday and Saturday nights",
                     "Wearable on every night, no manual edits", "Daily check-in below, four questions"],
        "checkin": [
            {"id": "wake", "q": "Up within 30 minutes of my weekday time?", "type": "yesno"},
            {"id": "lights", "q": "Lights out by 12:30 last night?", "type": "yesno"},
            {"id": "energy", "q": "Energy this morning?", "type": "scale", "min": 1, "max": 5},
            {"id": "sleep", "q": "Hours slept, from the wearable", "type": "number", "min": 0, "max": 14, "step": 0.1},
        ],
        "baseline": {"label": f"weekend nights, {WINDOW}", "sleep_h": s["wk_mean"], "weekday_sleep_h": s["wd_mean"], "hrv_ms": None},
        "success": f"Across the four weekend nights, average sleep within 0.3 h of the weekday average ({h(s['wd_mean'])}), with no weekday night shortened to pay for it.",
    }


def main(real: bool) -> None:
    out = mask.output_dir(real)
    c = json.loads((out / "candidates.json" if real else HERE / "candidates.json").read_text())
    rows = json.loads((out / "daily.json").read_text())
    s = weekend_stats(rows)
    (out / "patterns.json").write_text(json.dumps(patterns(c, s), indent=2, ensure_ascii=False))
    (out / "test.json").write_text(json.dumps(test(s), indent=2, ensure_ascii=False))
    print(f"wrote {out}/patterns.json and test.json |", s)


if __name__ == "__main__":
    main("--real" in sys.argv)
