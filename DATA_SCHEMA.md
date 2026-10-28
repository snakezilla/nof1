# nof1 data contract (web reads these from /data/*.json)

All numbers are computed in `prep/` (Python) from Ahsan's Apple Health export, daily aggregates only.
The example values below are made up to show the shape; the shipped values are masked (see mask.json).
No raw readings, no timestamps finer than a day, no locations.

## daily.json  (array, one object per calendar day, ascending)
{ "date": "2026-05-12",          // ISO date, local
  "hrv_ms": 54.2,                 // median of the day's HRV (SDNN) readings, null if none
  "hrv_n": 12,                    // number of readings behind hrv_ms
  "sleep_h": 6.4,                 // hours asleep (not in bed), null if none
  "deep_h": 1.1, "rem_h": 1.3,    // null when the source has no stages
  "workout_min": 35,              // 0 if none
  "workout_types": ["running"],   // [] if none
  "mindful_min": 5 }              // 0 if none

## patterns.json  (array, 3 items)
{ "id": "short-sleep-hrv",
  "title": "Short nights cost me HRV the next morning",
  "finding": "one or two sentences, written from the numbers below",
  "numbers": { "a_label": "nights under 6 h", "a_value": "48 ms next morning",
               "b_label": "nights 7 h or more", "b_value": "57 ms",
               "n_a": 83, "n_b": 410, "window": "Jul 2022 to May 2026" },
  "caveat": "one sentence on what this does not prove" }

## test.json  (one object: the single 2-week experiment the site proposes)
{ "title": "Two weeks of a 10:30 pm lights-out",
  "hypothesis": "...", "why": "one sentence tying it to a pattern id",
  "pattern_id": "short-sleep-hrv",
  "duration_days": 14,
  "protocol": ["lights out by 10:30 pm", "no screens after 10:00 pm"],
  "checkin": [ { "id": "energy", "q": "Energy this morning?", "type": "scale", "min": 1, "max": 5 },
               { "id": "lights", "q": "Lights out by 10:30 last night?", "type": "yesno" } ],
  "baseline": { "label": "last 30 nights", "sleep_h": 6.3, "hrv_ms": 51 },
  "success": "what 'it worked' looks like in numbers" }

## meta.json
{ "range": { "from": "2022-07-15", "to": "2026-05-13" },
  "days": 1398,
  "sources": ["Apple Watch", "Unstrap", "Strava", "Nike Run Club"],
  "built": "2026-10-26",
  "repo": "https://github.com/snakezilla/nof1" }

## mask.json  (written only by a masked run; the build refuses to publish without it)
{ "masked": true, "method": "...", "ranges": { "sleep": "x0.85 to x1.15", ... }, "real": ["..."] }
daily.json, patterns.json, test.json and figures.json are all computed from the masked rows.
meta.json carries "masked": true.

## meta.json provenance.fusion  (counts of records, not health values)
{ "raw_lines": 609918, "repeats": 363564, "records": 267399, "dropped_streams": 1, "days": 365 }
