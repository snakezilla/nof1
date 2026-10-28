import pytest

import mask

ROW = {"date": "2024-06-01", "hrv_ms": 50.0, "hrv_n": 12, "sleep_h": 7.0, "deep_h": 1.0, "rem_h": 1.5,
       "awake_min": 40, "bed_h": 23.5, "workout_min": 60, "workout_types": ["cycling"], "mindful_min": 10}
EMPTY = {**ROW, "date": "2024-06-02", "hrv_ms": None, "hrv_n": 0, "sleep_h": None, "deep_h": None, "rem_h": None,
         "awake_min": None, "bed_h": None, "workout_min": 0, "workout_types": [], "mindful_min": 0}


def days(n: int) -> list[dict]:
    return [{**ROW, "date": f"2024-{1 + i // 28:02d}-{1 + i % 28:02d}"} for i in range(n)]


def test_same_seed_same_values():
    assert mask.mask_rows(days(30), "abc") == mask.mask_rows(days(30), "abc")


def test_another_seed_other_values():
    a, b = mask.mask_rows(days(30), "abc"), mask.mask_rows(days(30), "xyz")
    assert [r["sleep_h"] for r in a] != [r["sleep_h"] for r in b]


def test_each_day_draws_its_own_amount():
    assert len({r["sleep_h"] for r in mask.mask_rows(days(30), "abc")}) > 20


def test_zeros_and_missing_stay_as_they_are():
    m = mask.mask_row(EMPTY, "abc")
    assert m["workout_min"] == 0 and m["mindful_min"] == 0
    assert all(m[k] is None for k in ("hrv_ms", "sleep_h", "deep_h", "rem_h", "awake_min", "bed_h"))


def test_days_with_data_keep_data():
    m = mask.mask_row({**ROW, "workout_min": 1, "mindful_min": 1}, "abc")
    assert m["workout_min"] >= 1 and m["mindful_min"] >= 1


def test_real_fields_are_untouched():
    for m in mask.mask_rows(days(60), "abc"):
        assert m["date"].startswith("2024-") and m["workout_types"] == ["cycling"] and m["hrv_n"] == 12


def test_ranges_are_respected():
    year = mask.year_shift("seed")
    for m in mask.mask_rows(days(200), "seed"):
        month = mask.month_shift("seed", m["date"][:7])
        f = m["sleep_h"] / ROW["sleep_h"] / year["sleep"] / month["sleep"]
        assert 0.85 - 0.003 <= f <= 1.15 + 0.003
        f_total = m["sleep_h"] / ROW["sleep_h"]
        assert abs(m["deep_h"] / ROW["deep_h"] - f_total) < 0.02 and abs(m["rem_h"] / ROW["rem_h"] - f_total) < 0.02
        shift = m["bed_h"] - ROW["bed_h"] - year["bed"] - month["bed"]
        assert -0.75 - 0.005 <= shift <= 0.75 + 0.005
        k = year["minutes"]
        assert 0.7 * 40 * k - 0.5 <= m["awake_min"] <= 1.3 * 40 * k + 0.5
        assert 0.7 * 60 * k - 0.5 <= m["workout_min"] <= 1.3 * 60 * k + 0.5
        assert 0.7 * 10 * k - 0.5 <= m["mindful_min"] <= 1.3 * 10 * k + 0.5
        assert 0.85 * 50 - 0.05 <= m["hrv_ms"] <= 1.15 * 50 + 0.05
        assert isinstance(m["awake_min"], int) and isinstance(m["workout_min"], int)


def test_year_and_month_shifts_stay_in_range_and_follow_the_seed():
    for seed in ("a", "b", "c", "d"):
        y = mask.year_shift(seed)
        assert 0.85 <= y["sleep"] <= 1.15 and -0.75 <= y["bed"] <= 0.75 and 0.75 <= y["minutes"] <= 1.25
        m = mask.month_shift(seed, "2024-06")
        assert 0.93 <= m["sleep"] <= 1.07 and -0.33 <= m["bed"] <= 0.33
    assert mask.year_shift("a") == mask.year_shift("a") != mask.year_shift("b")
    assert mask.month_shift("a", "2024-06") != mask.month_shift("a", "2024-07")


def test_weekend_and_weekday_share_the_month_and_year_shifts():
    # 2024-06-07 is a Friday, 2024-06-08 a Saturday: same month, same year draw, own day draw.
    fri, sat = (mask.mask_row({**ROW, "date": d}, "abc") for d in ("2024-06-07", "2024-06-08"))
    shared = mask.year_shift("abc")["sleep"] * mask.month_shift("abc", "2024-06")["sleep"]
    for m in (fri, sat):
        assert 0.85 - 0.003 <= m["sleep_h"] / ROW["sleep_h"] / shared <= 1.15 + 0.003


def test_input_rows_are_not_changed():
    rows = days(5)
    before = [dict(r) for r in rows]
    mask.mask_rows(rows, "abc")
    assert rows == before


def test_an_empty_seed_is_refused():
    with pytest.raises(ValueError):
        mask.mask_row(ROW, "")


def test_no_public_folder_without_a_seed(tmp_path):
    public = tmp_path / "public"
    with pytest.raises(SystemExit, match="NOF1_SEED"):
        mask.output_dir(False, env={}, public=public, private=tmp_path / "private")
    with pytest.raises(SystemExit):
        mask.output_dir(False, env={"NOF1_SEED": "  "}, public=public, private=tmp_path / "private")
    assert not public.exists()


def test_seed_opens_the_public_folder_and_real_goes_to_private(tmp_path):
    assert mask.output_dir(False, env={"NOF1_SEED": "s"}, public=tmp_path / "pub", private=tmp_path / "priv") == tmp_path / "pub"
    assert mask.output_dir(True, env={}, public=tmp_path / "pub2", private=tmp_path / "priv") == tmp_path / "priv"
    assert not (tmp_path / "pub2").exists()


def test_mask_info_says_what_is_real(tmp_path):
    mask.write_mask_info(tmp_path)
    text = (tmp_path / "mask.json").read_text()
    assert '"masked": true' in text and "workout types" in text and "seed" in text
    assert "per day" in text and "per month" in text and "whole year" in text
