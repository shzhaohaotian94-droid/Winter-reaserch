"""市场情绪聚合层。

把已有的真实行情、市场广度、涨跌停池和公开 RSS 观点源合成一个可解释的
情绪看板。任何分数都由客观字段机械计算；缺失字段不补零、不生成模拟数据。
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from html import unescape

import astock
import market
import newsradar

BEIJING = timezone(timedelta(hours=8))

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


def calculate_pulse(indices: list[dict], overview: dict, emotion: dict) -> dict:
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

    components = [
        _component("breadth", "市场广度", breadth, 0.30, "上涨家数占全部涨跌平家数的比例"),
        _component("limit", "涨跌停强弱", limit_strength, 0.20, "涨停与跌停家数的相对强弱"),
        _component("seal", "封板质量", seal_score, 0.15, "封板数占涨停尝试总数的比例"),
        _component("promotion", "连板晋级", promotion_score, 0.15, "今日连板数占昨日涨停数的比例"),
        _component("height", "空间高度", height_score, 0.10, "最高连板按 8 板映射到 100 分并封顶"),
        _component("index", "指数动能", index_score, 0.10, "主要指数平均涨跌幅映射到 0-100"),
    ]
    valid = [c for c in components if c["value"] is not None]
    weight_sum = sum(c["weight"] for c in valid)
    score = round(sum(c["value"] * c["weight"] for c in valid) / weight_sum, 1) if weight_sum else None

    if score is None:
        phase, signal = "数据不足", "等待有效行情数据"
    elif score >= 80:
        phase, signal = "亢奋", "强势与拥挤并存，重点观察炸板和高位兑现"
    elif score >= 65:
        phase, signal = "升温", "赚钱效应扩散，仍需确认指数和广度是否同向"
    elif score >= 45:
        phase, signal = "中性", "多空均衡，优先观察结构分化"
    elif score >= 30:
        phase, signal = "降温", "赚钱效应收缩，控制追高频率"
    else:
        phase, signal = "冰点", "极弱环境，等待广度和封板率修复"

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
        "components": components,
        "breadth_score": breadth,
        "index_score": index_score,
        "index_avg_change": avg_change,
        "divergence": divergence,
        "divergence_text": divergence_text,
        "formula": "有效分项加权：广度30% + 涨跌停20% + 封板15% + 晋级15% + 高度10% + 指数10%",
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
    return {
        "as_of": datetime.now(BEIJING).strftime("%Y-%m-%d %H:%M:%S"),
        "indices": indices,
        "overview": overview,
        "emotion": emotion,
        "pulse": calculate_pulse(indices, overview, emotion),
        "opinions": opinions,
        "sources": {
            "market": "AkShare 乐咕市场活跃度 + 东方财富涨跌停池/行业资金流 + 指数行情",
            "opinions": "investment-news 公开 RSS 缓存中的专业研究与市场评论源",
            "cache": "行情 5 分钟共享缓存；观点按资讯雷达最近一次刷新",
        },
    }
