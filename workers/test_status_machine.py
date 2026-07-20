"""Unit tests for the stream health state machine (no network)."""
from common import apply_stream_check, next_fail_count, status_from_fail_count


def test_success_resets():
    assert apply_stream_check(9, True) == ("online", 0)
    assert apply_stream_check(0, True) == ("online", 0)


def test_one_failure_checking():
    assert apply_stream_check(0, False) == ("checking", 1)
    assert status_from_fail_count(2) == "checking"


def test_three_failures_offline():
    assert apply_stream_check(2, False) == ("offline", 3)
    assert status_from_fail_count(9) == "offline"


def test_ten_failures_blocked():
    assert apply_stream_check(9, False) == ("blocked", 10)
    assert status_from_fail_count(15) == "blocked"


def test_no_drift_on_increment():
    count = 0
    for _ in range(12):
        count = next_fail_count(count, False)
    assert count == 12


if __name__ == "__main__":
    test_success_resets()
    test_one_failure_checking()
    test_three_failures_offline()
    test_ten_failures_blocked()
    test_no_drift_on_increment()
    print("All status machine tests passed.")
