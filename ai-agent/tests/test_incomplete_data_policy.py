from main import _decision_for_incomplete_data


def test_incomplete_data_defaults_to_successful_fallback():
    decision, confidence, reason = _decision_for_incomplete_data()

    assert decision == "Successful"
    assert 0.0 <= confidence <= 1.0
    assert reason == "insufficient_data_fallback_success"
