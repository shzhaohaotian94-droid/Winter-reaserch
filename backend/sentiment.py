"""市场情绪聚合层。

把已有的真实行情、市场广度、涨跌停池和公开 RSS 观点源合成一个可解释的
情绪看板。任何分数都由客观字段机械计算；缺失字段不补零、不生成模拟数据。
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path
from threading import Lock

import hashlib
import json
import astock
import market
import newsradar

BEIJING = timezone(timedelta(hours=8))
VOTE_FILE = Path(__file__).parent / ".cache" / "sentiment_votes.json"
VOTE_LOCK = Lock()

SENTIMENT_BANDS = [
    {"min": 0, "max": 9, "label": "极度冰点", "color": "#064e3b", "meaning": "全网悲观，风险偏好极低"},
    {"min": 10, "max": 19, "label": "冰点", "color": "#047857", "meaning": "恐慌占优，等待止跌信号"},
    {"min": 20, "max": 29, "label": "极弱", "color": "#0f9f75", "meaning": "亏钱效应明显，承接偏弱"},
    {"min": 30, "max": 39, "label": "偏冷", "color": "#22a06b", "meaning": "情绪降温，追高胜率较低"},
    {"min": 40, "max": 49, "label": "谨慎", "color": "#64748b", "meaning": "多空拉锯，结构分化"},
    {"min": 50, "max": 59, "label": "平衡", "color": "#d4a72c", "meaning": "风险偏好中性，等待方向"},
    {"min": 60, "max": 69, "label": "回暖", "color": "#f59e0b", "meaning": "赚钱效应开始扩散"},
    {"min": 70, "max": 79, "label": "活跃", "color": "#f97316", "meaning": "做多热度较高，题材活跃"},
    {"min": 80, "max": 89, "label": "高热", "color": "#ef4444", "meaning": "情绪高涨，同时警惕拥挤"},
    {"min": 90, "max": 100, "label": "极度亢奋", "color": "#b91c1c", "meaning": "全网看涨热情高涨，注意兑现"},
]

# 这些来源来自 integrations/investment-news/sources.json，优先保留研究者专栏、
# 专业评论和宏观市场栏目。它们是“公开观点源”，不是平台私域账号抓取。
OPINION_SOURCES = {
    "SemiAnalysis",
    "Import AI",
    "Stratechery",
    "Seeking Alpha",
    "华尔街见闻",
    "WSJ Markets",
    "CNBC",
    "CnEVPost",
    "Payload",
}

POSITIVE = {
    "上调", "增长", "回暖", "复苏", "扩张", "突破", "创新高", "超预期", "订单", "放量",
    "流入", "走强", "改善", "提速", "景气", "受益", "bull", "bullish", "upside", "beat",
    "growth", "strong", "surge", "rally", "recovery", "upgrade", "accelerate",
}
NEGATIVE = {
    "下调", "下滑", "风险", "放缓", "承压", "过剩", "流出", "走弱", "低于预期", "警告",
    "收缩", "衰退", "亏损", "bear", "bearish", "downside", "miss", "risk", "weak", "slow",
    "decline", "warning", "cut", "pressure", "selloff", "war", "attack", "strike", "conflict",
    "crisis", "tension", "threaten", "关闭", "袭击", "冲突", "危机", "制裁",
}

RELEVANT = {
    "a股", "港股", "美股", "股市", "股票", "市场", "交易", "投资", "经济", "通胀", "利率", "央行",
    "美联储", "债券", "芯片", "半导体", "ai", "人工智能", "机器人", "医药", "制药", "航天", "太空",
    "能源", "石油", "黄金", "财报", "业绩", "ipo", "供应链", "资本开支", "估值", "融资", "并购",
    "中国", "政策", "关税", "出口", "伊朗", "霍尔木兹", "market", "stock", "equity", "investor",
    "economy", "inflation", "rate", "federal reserve", "bond", "chip", "semiconductor", "robot", "pharma",
    "biotech", "space", "energy", "oil", "earnings", "supply chain", "capex", "valuation", "merger",
    "china", "tariff", "export", "trade", "dollar", "technology", "bank", "fund", "geopolitics", "iran",
}


def _clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def _component(key: str, label: str, value, weight: float, note: str) -> dict:
    return {"key": key, "label": label, "value": value, "weight": weight, "note": note}


def _score_band(score: float | None) -> dict | None:
    if score is None:
        return None
    return next((band for band in SENTIMENT_BANDS if band["min"] <= score <= band["max"] + 0.9), SENTIMENT_BANDS[-1])


def _read_votes() -> dict:
    try:
        data = json.loads(VOTE_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def vote_snapshot() -> dict:
    with VOTE_LOCK:
        votes = _read_votes()
    counts = {choice: sum(1 for value in votes.values() if value == choice) for choice in ("bull", "neutral", "bear")}
    total = sum(counts.values())
    score = round((counts["bull"] * 100 + counts["neutral"] * 50) / total, 1) if total else None
    return {
        "counts": counts,
        "total": total,
        "score": score,
        "sample_ready": total >= 20,
        "minimum_sample": 20,
        "method": "匿名浏览器投票；同一浏览器可更新选择，满20份样本后纳入综合分",
    }


def record_vote(choice: str, voter_token: str) -> dict:
    if choice not in {"bull", "neutral", "bear"}:
        raise ValueError("无效投票选项")
    token = (voter_token or "").strip()
    if not 16 <= len(token) <= 128:
        raise ValueError("无效投票标识")
    voter_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with VOTE_LOCK:
        votes = _read_votes()
        votes[voter_hash] = choice
        VOTE_FILE.parent.mkdir(parents=True, exist_ok=True)
        temp_file = VOTE_FILE.with_suffix(".tmp")
        temp_file.write_text(json.dumps(votes, ensure_ascii=False, indent=2), encoding="utf-8")
        temp_file.replace(VOTE_FILE)
    return vote_snapshot()


def calculate_pulse(
    indices: list[dict], overview: dict, emotion: dict, opinions: dict | None = None, votes: dict | None = None,
) -> dict:
    """合成 0-100 情绪温度，并完整返回每个分项和计算口径。"""
    sent = (overview or {}).get("sentiment") or {}
    up = int(sent.get("up") or 0)
    down = int(sent.get("down") or 0)
    flat = int(sent.get("flat") or 0)
    breadth_den = up + down + flat
    breadth = round(up / breadth_den * 100, 1) if breadth_den else None

    zt = int((emotion or {}).get("zt_count") or sent.get("zt_real") or 0)
    dt = int((emotion or {}).get("dt_count") or sent.get("dt_real") or 0)
    extreme_den = zt + dt
    limit_strength = round(50 + (zt - dt) / extreme_den * 50, 1) if extreme_den else None

    seal = (emotion or {}).get("seal_rate")
    seal_score = round(float(seal) * 100, 1) if seal is not None else None
    promotion = (emotion or {}).get("promotion_rate")
    promotion_score = round(float(promotion) * 100, 1) if promotion is not None else None
    max_boards = int((emotion or {}).get("max_boards") or 0)
    height_score = round(_clamp(max_boards / 8 * 100), 1) if max_boards else None

    changes = [float(x["change_pct"]) for x in indices or [] if x.get("change_pct") is not None]
    avg_change = round(sum(changes) / len(changes), 2) if changes else None
    index_score = round(_clamp(50 + avg_change * 16), 1) if avg_change is not None else None

    sectors = (overview or {}).get("sectors") or []
    positive_flow = sum(max(float(row.get("net") or 0), 0) for row in sectors)
    negative_flow = sum(abs(min(float(row.get("net") or 0), 0)) for row in sectors)
    flow_total = positive_flow + negative_flow
    fund_score = round(positive_flow / flow_total * 100, 1) if flow_total else None

    opinions = opinions or {}
    opinion_counts = opinions.get("counts") or {}
    directional_opinions = int(opinion_counts.get("偏多") or 0) + int(opinion_counts.get("偏空") or 0)
    opinion_score = round(_clamp(50 + float(opinions.get("consensus") or 0) / 2), 1) if directional_opinions >= 3 else None
    votes = votes or {}
    vote_score = votes.get("score") if votes.get("sample_ready") else None

    components = [
        _component("breadth", "市场广度", breadth, 0.20, "上涨家数占全部涨跌平家数的比例"),
        _component("limit", "涨跌停强弱", limit_strength, 0.15, "涨停与跌停家数的相对强弱"),
        _component("seal", "封板质量", seal_score, 0.10, "封板数占涨停尝试总数的比例"),
        _component("promotion", "连板晋级", promotion_score, 0.10, "今日连板数占昨日涨停数的比例"),
        _component("height", "空间高度", height_score, 0.10, "最高连板按 8 板映射到 100 分并封顶"),
        _component("index", "指数动能", index_score, 0.10, "主要指数平均涨跌幅映射到 0-100"),
        _component("fund", "主力资金", fund_score, 0.10, "行业主力净流入占流入与流出绝对额之和"),
        _component("opinion", "公开观点", opinion_score, 0.10, "专业公开观点源标题的偏多/偏空机械分类"),
        _component("retail", "散户投票", vote_score, 0.05, "匿名投票满20份样本后纳入，未达门槛不计分"),
    ]
    valid = [c for c in components if c["value"] is not None]
    weight_sum = sum(c["weight"] for c in valid)
    score = round(sum(c["value"] * c["weight"] for c in valid) / weight_sum, 1) if weight_sum else None

    band = _score_band(score)
    phase = band["label"] if band else "数据不足"
    signal = band["meaning"] if band else "等待有效行情数据"

    divergence = round(abs((breadth or 50) - (index_score or 50)), 1) if breadth is not None and index_score is not None else None
    divergence_text = "—"
    if divergence is not None:
        if divergence >= 35:
            divergence_text = "极端分化"
        elif divergence >= 20:
            divergence_text = "明显分化"
        elif divergence >= 10:
            divergence_text = "轻度分化"
        else:
            divergence_text = "指数与广度共振"

    return {
        "score": score,
        "phase": phase,
        "signal": signal,
        "band": band,
        "bands": SENTIMENT_BANDS,
        "components": components,
        "breadth_score": breadth,
        "index_score": index_score,
        "index_avg_change": avg_change,
        "divergence": divergence,
        "divergence_text": divergence_text,
        "coverage": [
            {"key": "market", "label": "盘面行情", "active": any(c["value"] is not None for c in components[:6]), "note": "指数、市场广度与短线梯队"},
            {"key": "fund", "label": "主力资金", "active": fund_score is not None, "note": "行业资金净流入/流出"},
            {"key": "opinion", "label": "公开观点", "active": opinion_score is not None, "note": f"{directional_opinions} 条方向性样本"},
            {"key": "retail", "label": "散户投票", "active": vote_score is not None, "note": f"{votes.get('total', 0)} / 20 份"},
            {"key": "comments", "label": "评论区情绪", "active": False, "note": "暂无合规稳定的公开评论接口，未纳入"},
        ],
        "formula": "有效分项加权：广度20% + 涨跌停15% + 封板10% + 晋级10% + 高度10% + 指数10% + 主力资金10% + 公开观点10% + 散户投票5%",
    }


def classify_opinion(title: str, summary: str = "") -> tuple[str, float]:
    blob = f"{title} {summary}".lower()
    pos = sum(1 for word in POSITIVE if word in blob)
    neg = sum(1 for word in NEGATIVE if word in blob)
    if pos > neg:
        stance = "偏多"
    elif neg > pos:
        stance = "偏空"
    else:
        stance = "中性"
    confidence = round(min(0.92, 0.52 + abs(pos - neg) * 0.08), 2)
    return stance, confidence


def opinion_feed(limit: int = 24) -> dict:
    radar = newsradar.get_radar(force=False)
    rows = []
    for industry in radar.get("industries", []):
        for item in industry.get("items", []):
            if item.get("source") not in OPINION_SOURCES:
                continue
            title = unescape(item.get("title", ""))
            summary = unescape(item.get("summary", ""))
            blob = f"{title} {summary}".lower()
            if not any(word in blob for word in RELEVANT):
                continue
            stance, confidence = classify_opinion(title, summary)
            rows.append({
                "title": title,
                "url": item.get("url", ""),
                "time": item.get("time", "—"),
                "ts": item.get("ts", 0),
                "source": item.get("source", ""),
                "summary": summary,
                "industry": industry.get("name", ""),
                "stance": stance,
                "confidence": confidence,
            })
    rows.sort(key=lambda row: row.get("ts", 0), reverse=True)
    rows = rows[:limit]
    counts = {"偏多": 0, "中性": 0, "偏空": 0}
    for row in rows:
        counts[row["stance"]] += 1
    directional = counts["偏多"] + counts["偏空"]
    consensus = round((counts["偏多"] - counts["偏空"]) / directional * 100, 1) if directional else 0
    return {
        "generated_at": radar.get("generated_at"),
        "items": rows,
        "counts": counts,
        "consensus": consensus,
        "source_count": len({row["source"] for row in rows}),
        "method": "公开 RSS/专栏标题关键词机械分类；立场只描述文本语气，不代表事实真伪或未来涨跌",
    }


def get_dashboard() -> dict:
    try:
        indices = astock.index_quote()
    except Exception:
        indices = []
    try:
        overview = market.get_overview()
    except Exception:
        overview = {"sentiment": {}, "sectors": [], "updated": ""}
    try:
        emotion = market.get_short_term_emotion()
    except Exception:
        emotion = {}
    opinions = opinion_feed()
    votes = vote_snapshot()
    return {
        "as_of": datetime.now(BEIJING).strftime("%Y-%m-%d %H:%M:%S"),
        "indices": indices,
        "overview": overview,
        "emotion": emotion,
        "pulse": calculate_pulse(indices, overview, emotion, opinions, votes),
        "opinions": opinions,
        "votes": votes,
        "sources": {
            "market": "AkShare 乐咕市场活跃度 + 东方财富涨跌停池/行业资金流 + 指数行情",
            "opinions": "investment-news 公开 RSS 缓存中的专业研究与市场评论源",
            "cache": "行情 5 分钟共享缓存；观点按资讯雷达最近一次刷新",
        },
    }
