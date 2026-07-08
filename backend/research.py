"""Winter research library endpoints.

Local files are indexed from the user's research folder. Online reports are
pulled from Eastmoney reportapi and filtered by AI-compute/material keywords.
All outputs are research references only, not investment advice.
"""

from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from typing import Any

import astock

RESEARCH_ROOT = Path(r"C:\Users\Administrator\Desktop\思考")
RESEARCH_ROOT = Path(os.environ.get("VR_RESEARCH_ROOT", str(RESEARCH_ROOT)))

KEYWORDS = [
    "AI算力", "算力", "上游材料", "卡口材料", "电子特气", "六氟化钨", "WF", "CMP",
    "抛光", "球硅", "硅微粉", "GMC", "EMC", "ABF", "靶材", "先进封装", "HBM",
    "光模块", "CPO", "PCB", "覆铜板", "液冷", "玻璃基板", "MLCC",
]

SEGMENT_RULES: list[tuple[str, list[str]]] = [
    ("上游卡口材料", ["上游材料", "卡口材料", "电子特气", "六氟化钨", "WF", "CMP", "抛光", "球硅", "硅微粉", "GMC", "EMC", "ABF", "靶材"]),
    ("HBM/先进封装", ["HBM", "先进封装", "封装", "玻璃基板", "TGV"]),
    ("光模块/光互联", ["光模块", "CPO", "硅光", "光互联"]),
    ("PCB/CCL", ["PCB", "覆铜板", "CCL", "载板", "ABF"]),
    ("液冷散热", ["液冷", "散热", "冷板"]),
    ("AI算力综合", ["AI算力", "算力", "数据中心", "服务器", "AIDC"]),
]

SERENITY_LEADERS = [
    {
        "name": "中船特气", "code": "688146", "molecule": "WF6（六氟化钨）",
        "dims": [1.8, 1.5, 1.5, 1.0, 1.4, 0.9, 0.3],
        "note": "全球最大六氟化钨基地；旧看板 Serenity 示例分。重点核验订单、价格与扩产。",
        "source": "旧看板示例分 + Serenity v3",
    },
    {
        "name": "联瑞新材", "code": "688300", "molecule": "球形硅微粉",
        "dims": [1.2, 1.5, 1.2, 1.0, 0.9, 0.5, 0.6],
        "note": "球硅国产领先，EMC/CCL/先进封装填料受益；旧看板 Serenity 示例分。",
        "source": "旧看板示例分 + Serenity v3",
    },
    {
        "name": "华海诚科", "code": "688535", "molecule": "GMC/EMC 塑封料",
        "dims": [1.2, 0.7, 1.2, 1.0, 0.9, 0.5, 0.3],
        "note": "EMC 已量产，GMC 仍需核验量产收入；认证灯是核心排雷点。",
        "source": "旧看板示例分 + Serenity v3",
    },
    {
        "name": "安集科技", "code": "688019", "molecule": "CMP 抛光液",
        "dims": [1.2, 1.5, 1.4, 1.0, 0.9, 0.6, 0.4],
        "note": "CMP 抛光液国产龙头，批量突破；需跟踪先进制程占比和客户验证。",
        "source": "旧看板初评 + Serenity v3",
    },
    {
        "name": "鼎龙股份", "code": "300054", "molecule": "CMP 抛光垫/材料",
        "dims": [1.4, 1.2, 1.4, 1.0, 0.9, 0.6, 0.4],
        "note": "抛光垫国产稀缺，耗材刚需；需核验收入占比与客户集中度。",
        "source": "旧看板初评 + Serenity v3",
    },
    {
        "name": "江丰电子", "code": "300666", "molecule": "高纯溅射靶材",
        "dims": [1.2, 1.5, 1.2, 1.0, 0.8, 0.5, 0.5],
        "note": "高纯靶材国产龙头；卡口在纯度、认证和晶圆厂导入。",
        "source": "旧看板初评 + Serenity v3",
    },
]


def _segment(title: str) -> str:
    for segment, keys in SEGMENT_RULES:
        if any(k.lower() in title.lower() for k in keys):
            return segment
    return "其他"


def _tier(total: float) -> str:
    if total >= 8.5:
        return "S"
    if total >= 7.0:
        return "A"
    if total >= 5.5:
        return "B"
    if total >= 4.0:
        return "C"
    return "出局"


def local_reports(limit: int = 80) -> list[dict[str, Any]]:
    exts = {".pdf", ".docx", ".xlsx", ".md", ".txt"}
    rows: list[dict[str, Any]] = []
    if not RESEARCH_ROOT.exists():
        return rows
    for p in RESEARCH_ROOT.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in exts:
            continue
        title = p.stem
        if not any(k.lower() in title.lower() for k in KEYWORDS + ["Serenity", "瓶颈"]):
            continue
        rows.append({
            "title": title,
            "type": p.suffix.lower().lstrip("."),
            "source": "本地思考目录",
            "path": str(p),
            "date": date.fromtimestamp(p.stat().st_mtime).isoformat(),
            "segment": _segment(title),
            "size": p.stat().st_size,
        })
    rows.sort(key=lambda r: r["date"], reverse=True)
    return rows[:limit]


def online_reports(days: int = 220, max_pages: int = 6) -> list[dict[str, Any]]:
    try:
        raw = astock.eastmoney_industry_reports(KEYWORDS, days=days, max_pages=max_pages)
    except Exception:
        return []
    rows: list[dict[str, Any]] = []
    for r in raw:
        title = r.get("title") or ""
        info_code = r.get("infoCode") or r.get("info_code") or ""
        rows.append({
            "title": title,
            "date": (r.get("publishDate") or r.get("date") or "")[:10],
            "org": r.get("orgSName") or r.get("orgName") or r.get("org") or "",
            "segment": _segment(title),
            "pdfUrl": astock.pdf_url(info_code) if info_code else None,
            "source": "东方财富研报",
        })
    rows.sort(key=lambda r: r.get("date") or "", reverse=True)
    return rows


def serenity_leaders() -> list[dict[str, Any]]:
    codes = [s["code"] for s in SERENITY_LEADERS]
    try:
        quotes = astock.tencent_quote(codes)
    except Exception:
        quotes = {}
    out: list[dict[str, Any]] = []
    for item in SERENITY_LEADERS:
        total = round(sum(item["dims"]), 1)
        q = quotes.get(item["code"], {})
        out.append({
            **item,
            "total": total,
            "tier": _tier(total),
            "quote": {
                "price": q.get("price"),
                "change_pct": q.get("change_pct"),
                "pe_ttm": q.get("pe_ttm"),
                "pb": q.get("pb"),
                "mcap_yi": q.get("mcap_yi"),
            },
        })
    return sorted(out, key=lambda r: (-r["total"], r["name"]))


def library(days: int = 220, max_pages: int = 6) -> dict[str, Any]:
    local = local_reports()
    online = online_reports(days=days, max_pages=max_pages)
    return {
        "as_of": date.today().isoformat(),
        "local_count": len(local),
        "online_count": len(online),
        "local_reports": local,
        "online_reports": online,
        "leaders": serenity_leaders(),
        "keywords": KEYWORDS,
    }
