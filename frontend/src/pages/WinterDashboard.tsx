import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bot, FileText, Plus, RefreshCw, Sparkles, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { api, type GlobalIndex, type IndexQuote, type Quote } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  serenityDimensions,
  winterPrinciples,
  winterSectors,
  winterWatchDefaults,
} from "@/data/winterResearch";

const WATCH_KEY = "winter-dashboard-watchlist";
const pctColor = (p: number | null | undefined) =>
  p == null ? "text-muted-foreground" : p > 0 ? "text-danger" : p < 0 ? "text-success" : "text-muted-foreground";

function loadWinterWatch() {
  try {
    const raw = localStorage.getItem(WATCH_KEY);
    const arr = raw ? JSON.parse(raw) : winterWatchDefaults;
    return Array.isArray(arr) ? arr.filter((x) => /^\d{6}$/.test(String(x))) : winterWatchDefaults;
  } catch {
    return winterWatchDefaults;
  }
}

function saveWinterWatch(codes: string[]) {
  try {
    localStorage.setItem(WATCH_KEY, JSON.stringify(codes));
  } catch {
    /* localStorage can be unavailable in privacy modes */
  }
}

export function WinterDashboard() {
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [globalIndices, setGlobalIndices] = useState<GlobalIndex[]>([]);
  const [codes, setCodes] = useState<string[]>(loadWinterWatch);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = (watchCodes = codes) => {
    setLoading(true);
    api.indices().then(setIndices).catch(() => {});
    api.globalIndices().then(setGlobalIndices).catch(() => {});
    if (watchCodes.length) {
      api.quote(watchCodes.join(",")).then(setQuotes).catch(() => {});
    } else {
      setQuotes({});
    }
    window.setTimeout(() => setLoading(false), 450);
  };

  useEffect(() => {
    refresh(codes);
  }, []);

  const addCode = () => {
    const c = input.trim();
    if (!/^\d{6}$/.test(c) || codes.includes(c)) {
      setInput("");
      return;
    }
    const next = [...codes, c];
    setCodes(next);
    saveWinterWatch(next);
    setInput("");
    refresh(next);
  };

  const removeCode = (c: string) => {
    const next = codes.filter((x) => x !== c);
    setCodes(next);
    saveWinterWatch(next);
    refresh(next);
  };

  const marketLine = useMemo(() => {
    const a = indices.map((i) => `${i.name} ${i.change_pct > 0 ? "+" : ""}${i.change_pct}%`).join(" / ");
    const g = globalIndices.map((i) => `${i.name} ${i.change_pct == null ? "-" : `${i.change_pct > 0 ? "+" : ""}${i.change_pct}%`}`).join(" / ");
    return [a, g].filter(Boolean).join(" | ") || "等待行情数据";
  }, [indices, globalIndices]);

  return (
    <div>
      <PageHeader
        title="Winter 的投资看板"
        subtitle="从旧 Vibe-Trading 迁入的个人投研入口：行情、自选、Serenity 卡口框架和重点产业链。"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => refresh()}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              刷新
            </button>
            <Link
              to="/research-library"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
            >
              <FileText className="h-4 w-4" />
              研报与评分
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
        <GlassCard className="glass-glow p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">市场快照</p>
              <h2 className="mt-1 text-xl font-bold">大盘 + 外围 + 自选</h2>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="rounded-lg bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">{marketLine}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {indices.map((i) => (
              <div key={i.name} className="rounded-lg bg-muted/25 p-3">
                <p className="truncate text-xs text-muted-foreground">{i.name}</p>
                <p className={cn("mt-1 font-mono text-lg font-bold", pctColor(i.change_pct))}>{i.price}</p>
                <p className={cn("text-xs", pctColor(i.change_pct))}>{i.change_pct > 0 ? "+" : ""}{i.change_pct}%</p>
              </div>
            ))}
            {globalIndices.slice(0, 4).map((i) => (
              <div key={i.key} className="rounded-lg bg-muted/25 p-3">
                <p className="truncate text-xs text-muted-foreground">{i.name}</p>
                <p className={cn("mt-1 font-mono text-lg font-bold", pctColor(i.change_pct))}>{i.price ?? "-"}</p>
                <p className={cn("text-xs", pctColor(i.change_pct))}>{i.change_pct == null ? "-" : `${i.change_pct > 0 ? "+" : ""}${i.change_pct}%`}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">本地自选</p>
              <h2 className="mt-1 text-lg font-bold">Winter Watchlist</h2>
            </div>
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="mb-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && addCode()}
              placeholder="6 位代码"
              className="min-w-0 flex-1 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button onClick={addCode} className="rounded-lg bg-primary/15 px-3 text-primary hover:bg-primary/25" title="加入自选">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {codes.map((c) => {
              const q = quotes[c];
              return (
                <div key={c} className="group flex items-center justify-between gap-3 rounded-lg bg-muted/25 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{q?.name || c}</p>
                    <p className="text-xs text-muted-foreground">{c}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={cn("font-mono text-sm font-bold", q ? pctColor(q.change_pct) : "text-muted-foreground")}>{q?.price ?? "-"}</p>
                      <p className={cn("text-xs", q ? pctColor(q.change_pct) : "text-muted-foreground")}>{q ? `${q.change_pct > 0 ? "+" : ""}${q.change_pct}%` : "-"}</p>
                    </div>
                    <button onClick={() => removeCode(c)} className="text-muted-foreground/40 opacity-0 hover:text-destructive group-hover:opacity-100" title="移除">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Serenity 瓶颈投资法</h3>
          <span className="text-xs text-muted-foreground/70">旧看板核心方法论</span>
        </div>
        <div className="grid gap-3 md:grid-cols-7">
          {serenityDimensions.map((d) => (
            <GlassCard key={d.name} className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{d.name}</p>
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">{d.weight}</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{d.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">重点研究板块</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {winterSectors.map((s) => {
            const Icon = s.icon;
            return (
              <GlassCard key={s.key} className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/15 p-2 text-primary"><Icon className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-bold">{s.title}</h4>
                      <p className="text-xs text-muted-foreground">{s.thesis}</p>
                    </div>
                  </div>
                  <Link to={s.route} className="text-muted-foreground hover:text-primary" title="打开板块">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {s.segments.map((seg) => (
                    <span key={seg} className="rounded-full bg-muted/35 px-2.5 py-1 text-xs text-muted-foreground">{seg}</span>
                  ))}
                </div>
                <div className="grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
                  <p><b className="text-foreground">卡口：</b>{s.serenity.bottleneck}</p>
                  <p><b className="text-foreground">替代：</b>{s.serenity.localization}</p>
                  <p><b className="text-foreground">催化：</b>{s.serenity.catalyst}</p>
                  <p><b className="text-foreground">风险：</b>{s.serenity.risk}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {winterPrinciples.map((p) => {
          const Icon = p.icon;
          return (
            <GlassCard key={p.title} className="p-4">
              <Icon className="mb-2 h-4 w-4 text-primary" />
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{p.text}</p>
            </GlassCard>
          );
        })}
      </div>

      <Disclaimer />
    </div>
  );
}
