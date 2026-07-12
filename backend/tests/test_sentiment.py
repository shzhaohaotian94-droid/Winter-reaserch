import sentiment


def test_calculate_pulse_uses_real_components():
    indices = [
        {"change_pct": 1.0},
        {"change_pct": 0.5},
        {"change_pct": -0.5},
        {"change_pct": 0.0},
    ]
    overview = {
        "sentiment": {"up": 3000, "down": 1500, "flat": 500},
        "sectors": [{"net": 80}, {"net": -20}],
    }
    emotion = {
        "zt_count": 80,
        "dt_count": 20,
        "seal_rate": 0.8,
        "promotion_rate": 0.4,
        "max_boards": 6,
    }
    opinions = {"counts": {"偏多": 4, "中性": 1, "偏空": 1}, "consensus": 60}
    pulse = sentiment.calculate_pulse(indices, overview, emotion, opinions)
    assert pulse["breadth_score"] == 60.0
    assert pulse["index_score"] == 54.0
    assert pulse["divergence"] == 6.0
    assert pulse["score"] is not None
    assert len(pulse["components"]) == 9
    assert pulse["bands"][0]["label"] == "极度冰点"
    assert pulse["components"][6]["value"] == 80.0
    assert pulse["components"][7]["value"] == 80.0


def test_calculate_pulse_reweights_missing_components():
    pulse = sentiment.calculate_pulse([], {"sentiment": {"up": 800, "down": 200, "flat": 0}}, {})
    assert pulse["score"] == 80.0
    assert pulse["phase"] == "高热"
    assert sum(item["value"] is not None for item in pulse["components"]) == 1


def test_vote_snapshot_only_enters_score_after_minimum_sample(tmp_path, monkeypatch):
    monkeypatch.setattr(sentiment, "VOTE_FILE", tmp_path / "votes.json")
    for index in range(20):
        sentiment.record_vote("bull" if index < 15 else "bear", f"browser-token-{index:03d}")
    votes = sentiment.vote_snapshot()
    assert votes["total"] == 20
    assert votes["sample_ready"] is True
    assert votes["score"] == 75.0
    pulse = sentiment.calculate_pulse([], {}, {}, {}, votes)
    assert pulse["score"] == 75.0


def test_opinion_classification_is_explainable():
    assert sentiment.classify_opinion("需求增长超预期，订单走强")[0] == "偏多"
    assert sentiment.classify_opinion("行业放缓，风险与过剩压力上升")[0] == "偏空"
    assert sentiment.classify_opinion("公司发布季度报告")[0] == "中性"
