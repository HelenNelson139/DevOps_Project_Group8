from core.feature_pipeline import normalize_raw_metrics, to_state_vector


def sample_raw_metrics():
    return {
        "weight_pct": 25.0,
        "e_canary": 0.01,
        "e_stable": 0.005,
        "l_canary": 0.2,
        "l_stable": 0.1,
        "cpu": 0.01,
        "mem_mb": 64.0,
        "rps": 20.0,
    }


def test_normalize_raw_metrics_returns_bounded_values():
    normalized = normalize_raw_metrics(sample_raw_metrics())

    assert set(normalized.keys()) == {
        "weight_n",
        "e_ratio_n",
        "l_ratio_n",
        "e_gap_n",
        "l_gap_n",
        "cpu_n",
        "mem_n",
        "rps_n",
    }
    assert all(0.0 <= value <= 1.0 for value in normalized.values())


def test_to_state_vector_has_expected_shape():
    vector = to_state_vector(sample_raw_metrics())

    assert len(vector) == 8
    assert all(0.0 <= value <= 1.0 for value in vector)
