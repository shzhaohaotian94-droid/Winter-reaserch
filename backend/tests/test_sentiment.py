import sentiment


def test_calculate_pulse_uses_real_components():
    indices = [
        {"change_pct": 1.0},
        {"change_pct": 0.5},
        {"change_pct": -0.5},
        {"change_pct": 0.0},
    ]
    overview = {"sentiment": {"up": 3000, "down": 1500, "flat": 500}}
    emotion = {
        "zt_count": 80,
        "dt_count": 20,
        "seal_rate": 0.8,
        "promotion_rate": 0.4,
        "max_boards": 6,
    }
    pulse = sentiment.calculate_pulse(indices, overview, emotion)
    assert pulse["breadth_score"] == 60.0
    assert pulse["index_score"] == 54.0
    assert pulse["divergence"] == 6.0
    assert pulse["score"] is not None
    assert len(pulse["components"]) == 6


def test_calculate_pulse_reweights_missing_components():
    pulse = sentiment.calculate_pulse([], {"sentiment": {"up": 800, "down": 200, "flat": 0}}, {})
    assert pulse["score"] == 80.0
    assert pulse["phase"] == "亢奋"
    assert sum(item["value"] is not None for item in pulse["components"]) == 1


def test_opinion_classification_is_explainable():
    assert sentiment.classify_opinion("需求增长超预期，订单走强")[0] == "偏多"
    assert sentiment.classify_opinion("行业放缓，风险与过剩压力上升")[0] == "偏空"
    assert sentiment.classify_opinion("公司发布季度报告")[0] == "中性"

