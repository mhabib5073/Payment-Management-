from app.services.insights_service import compute_stats


def test_stats_for_a_single_group():
    rows = [("India", "INR", 100), ("India", "INR", 300), ("India", "INR", 200)]
    [stats] = compute_stats(rows)
    assert (stats.headcount, stats.min_salary, stats.max_salary) == (3, 100, 300)
    assert (stats.avg_salary, stats.median_salary) == (200, 200)


def test_median_of_even_count_is_midpoint():
    rows = [("UK", "GBP", 100), ("UK", "GBP", 200), ("UK", "GBP", 300), ("UK", "GBP", 1000)]
    [stats] = compute_stats(rows)
    assert stats.median_salary == 250
    assert stats.avg_salary == 400  # the outlier pulls the mean, not the median


def test_groups_are_sorted_by_headcount():
    rows = [("A", "USD", 1), ("B", "USD", 1), ("B", "USD", 2)]
    assert [s.group for s in compute_stats(rows)] == ["B", "A"]


def test_different_currencies_are_never_mixed():
    rows = [("Engineer", "USD", 100_000), ("Engineer", "INR", 2_000_000)]
    stats = compute_stats(rows)
    assert {(s.currency, s.max_salary) for s in stats} == {("USD", 100_000), ("INR", 2_000_000)}


def test_no_rows_gives_no_stats():
    assert compute_stats([]) == []
    