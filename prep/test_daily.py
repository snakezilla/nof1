from datetime import datetime
from zoneinfo import ZoneInfo

from daily import build_daily
from patterns import compare

TZ = ZoneInfo("America/Toronto")


def t(s: str) -> datetime:
    return datetime.fromisoformat(s).replace(tzinfo=TZ)


def test_night_lands_on_the_morning_and_best_source_wins():
    sleep = [
        {"start": t("2026-05-01T23:00"), "end": t("2026-05-02T06:00"), "code": 0, "source": "Connect"},      # 7 h in bed only
        {"start": t("2026-05-01T23:30"), "end": t("2026-05-02T02:30"), "code": 3, "source": "Watch"},        # 3 h core
        {"start": t("2026-05-02T02:30"), "end": t("2026-05-02T03:30"), "code": 4, "source": "Watch"},        # 1 h deep
        {"start": t("2026-05-02T03:30"), "end": t("2026-05-02T05:30"), "code": 5, "source": "Watch"},        # 2 h REM
    ]
    rows = build_daily([], sleep, [], [])
    by = {r["date"]: r for r in rows}
    assert by["2026-05-02"]["sleep_h"] == 6.0 and by["2026-05-02"]["deep_h"] == 1.0 and by["2026-05-02"]["rem_h"] == 2.0
    assert "2026-05-01" not in by  # the range starts on the first day that has data


def test_in_bed_is_the_fallback_when_no_source_has_stages():
    sleep = [{"start": t("2026-05-01T23:00"), "end": t("2026-05-02T06:00"), "code": 0, "source": "Connect"}]
    rows = build_daily([], sleep, [], [])
    assert rows[-1]["sleep_h"] == 7.0 and rows[-1]["deep_h"] is None


def test_hrv_median_and_workout_sums_and_gap_days():
    hrv = [{"start": t("2026-05-01T07:00"), "value": 40.0, "source": "W"}, {"start": t("2026-05-01T08:00"), "value": 60.0, "source": "W"}]
    workouts = [{"start": t("2026-05-01T18:00"), "minutes": 20.0, "type": "running"}, {"start": t("2026-05-03T18:00"), "minutes": 10.4, "type": "cycling"}]
    rows = build_daily(hrv, [], workouts, [])
    assert [r["date"] for r in rows] == ["2026-05-01", "2026-05-02", "2026-05-03"]
    assert rows[0]["hrv_ms"] == 50.0 and rows[0]["hrv_n"] == 2 and rows[0]["workout_min"] == 20 and rows[0]["workout_types"] == ["running"]
    assert rows[1]["hrv_ms"] is None and rows[1]["workout_min"] == 0 and rows[1]["workout_types"] == []


def test_compare_needs_ten_each_and_reports_ci():
    assert compare([1.0] * 5, [2.0] * 20)["enough"] is False
    c = compare([50.0, 52.0, 48.0, 51.0, 49.0] * 4, [60.0, 62.0, 58.0, 61.0, 59.0] * 4)
    assert c["enough"] and c["diff"] == -10.0 and c["ci95"][0] <= -10.0 <= c["ci95"][1]
