import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDown, ArrowUp, BarChart3, ExternalLink, Gauge,
  CheckCircle2, Layers3, Loader2, MessageSquareText, Minus, RadioTower, RefreshCw,
  ThumbsDown, ThumbsUp, Users, XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";
import {
  api, ApiError, type OpinionItem, type SentimentDashboardData, type SentimentComponent,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type OpinionFilter = "全部" | OpinionItem["stance"];

const pctColor = (value: number) => value > 0 ? "text-danger" : value < 0 ? "text-success" : "text-muted-foreground";
const scoreColor = (value: number | null) => {
  if (value == null) return "text-muted-foreground";
  if (value >= 80) return "text-danger";
  if (value >= 65) return "text-amber-400";
  if (value >= 45) return "text-primary";
  return "text-success";
};
const fmt = (value: number | null | undefined, digits = 1) => value == null ? "—" : value.toFixed(digits);
const rate = (value: number | null | undefined) => value == null ? "—" : `${(value * 100).toFixed(1)}%`;
const VOTER_KEY = "winter-sentiment-voter";
let temporaryVoterToken = "";

function voterToken() {
  try {
    const stored = localStorage.getItem(VOTER_KEY);
    if (stored) return stored;
    const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}-${Math.random()}`;
    localStorage.setItem(VOTER_KEY, token);
    return token;
  } catch {
    temporaryVoterToken ||= crypto.randomUUID?.() || `${Date.now()}-${Math.random()}-${Math.random()}`;
    return temporaryVoterToken;
  }
}

function SentimentCompass({ pulse }: { pulse: SentimentDashboardData["pulse"] | undefined }) {
  const score = pulse?.score;
  const activeIndex = score == null ? -1 : Math.min(9, Math.floor(score / 10));
  const needle = score == null ? -90 : -90 + Math.max(0, Math.min(100, score)) * 1.8;
  return (
    <div>
      <div className="relative mx-auto h-[185px] w-full max-w-[350px] overflow-hidden" aria-label={`情绪罗盘 ${score ?? "数据不足"}分`}>
        {(pulse?.bands || []).map((band, index) => (
          <div
            key={band.min}
            className="absolute bottom-5 left-1/2 h-[135px] w-6 origin-[50%_100%] -translate-x-1/2"
            style={{ transform: `translateX(-50%) rotate(${-81 + index * 18}deg)` }}
          >
            <div
              className={cn("h-12 w-full rounded-sm border border-white/10 transition-all", activeIndex === index ? "opacity-100 shadow-[0_0_14px_currentColor]" : "opacity-55")}
              style={{ backgroundColor: band.color, color: band.color }}
              title={`${band.min}-${band.max} ${band.label}`}
            />
          </div>
        ))}
        <div
          className="absolute bottom-5 left-1/2 h-[108px] w-1 origin-[50%_100%] -translate-x-1/2 rounded-full bg-foreground shadow-lg transition-transform duration-700"
          style={{ transform: `translateX(-50%) rotate(${needle}deg)` }}
        >
          <div className="absolute -top-1 -left-1 h-3 w-3 rotate-45 border-l border-t border-foreground bg-foreground" />
        </div>
        <div className="absolute bottom-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-background bg-foreground" />
        <span className="absolute bottom-0 left-2 font-mono text-[11px] text-success">0 冰点</span>
        <span className="absolute bottom-0 right-2 font-mono text-[11px] text-danger">100 亢奋</span>
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-center">
          <p className={cn("font-mono text-4xl font-black", scoreColor(score ?? null))}>{fmt(score)}</p>
          <p className="text-xs font-bold">{pulse?.phase || "数据不足"}</p>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1" aria-label="十档情绪信号灯">
        {(pulse?.bands || []).map((band, index) => (
          <div key={band.min} className="min-w-0 text-center">
            <div
              className={cn("h-3 border border-white/10", activeIndex === index && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
              style={{ backgroundColor: band.color }}
              title={`${band.min}-${band.max} ${band.label}`}
            />
            <span className="mt-1 block truncate font-mono text-[9px] text-muted-foreground">{band.min}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentMeter({ item }: { item: SentimentComponent }) {
  const width = item.value == null ? 0 : Math.max(0, Math.min(100, item.value));
  return (
    <div className="border-b border-border/50 py-3 last:border-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">权重 {(item.weight * 100).toFixed(0)}% · {item.note}</p>
        </div>
        <span className={cn("font-mono text-lg font-extrabold", scoreColor(item.value))}>{fmt(item.value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-muted/60">
        <div className="h-full rounded bg-primary transition-[width] duration-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function OpinionRow({ item }: { item: OpinionItem }) {
  const stanceClass = item.stance === "偏多"
    ? "border-danger/30 bg-danger/10 text-danger"
    : item.stance === "偏空"
      ? "border-success/30 bg-success/10 text-success"
      : "border-border bg-muted/40 text-muted-foreground";
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="group block border-b border-border/50 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">{item.source}</span>
        <span>{item.time}</span>
        <span>{item.industry}</span>
        <span className={cn("rounded border px-1.5 py-0.5", stanceClass)}>{item.stance}</span>
        <span>文本置信度 {(item.confidence * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 flex items-start gap-2">
        <p className="flex-1 text-sm font-medium leading-6 group-hover:text-primary">{item.title}</p>
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
      </div>
      {item.summary && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</p>}
    </a>
  );
}

export function SentimentDashboard() {
  const [data, setData] = useState<SentimentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingOpinions, setRefreshingOpinions] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OpinionFilter>("全部");

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api.sentimentDashboard());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "情绪数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const refreshOpinions = async () => {
    setRefreshingOpinions(true);
    setError(null);
    try {
      setData(await api.sentimentRefreshOpinions());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "观点源刷新失败");
    } finally {
      setRefreshingOpinions(false);
    }
  };

  const submitVote = async (choice: "bull" | "neutral" | "bear") => {
    setVoting(true);
    setError(null);
    try {
      await api.sentimentVote(choice, voterToken());
      setData(await api.sentimentDashboard());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "情绪投票提交失败");
    } finally {
      setVoting(false);
    }
  };

  const sectors = data?.overview?.sectors || [];
  const sectorLeaders = sectors.slice(0, 5);
  const sectorLaggards = sectors.slice(-5).reverse();
  const sentiment = data?.overview?.sentiment;
  const emotion = data?.emotion;
  const pulse = data?.pulse;
  const opinions = useMemo(() => {
    const rows = data?.opinions?.items || [];
    return filter === "全部" ? rows : rows.filter((item) => item.stance === filter);
  }, [data, filter]);

  return (
    <div>
      <PageHeader
        title="情绪看板"
        subtitle="真实行情广度 × 短线梯队 × 行业轮动 × 公开观点源；缺失即标缺失，不使用随机模拟"
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="刷新行情"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> 刷新
          </button>
        }
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}。本页不会用模拟数字填充空缺。</span>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> 正在汇总真实市场数据…
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(data?.indices || []).map((item) => (
              <GlassCard key={item.name} className="p-3">
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className={cn("mt-1 font-mono text-lg font-extrabold", pctColor(item.change_pct))}>{item.price}</p>
                <p className={cn("text-xs", pctColor(item.change_pct))}>{item.change_pct > 0 ? "+" : ""}{item.change_pct}%</p>
              </GlassCard>
            ))}
          </section>
          <p className="-mt-2 text-right text-[11px] text-muted-foreground">
            涨跌停统计交易日：{emotion?.date || "—"} · 页面汇总时间：{data?.as_of || "—"}
          </p>

          <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <GlassCard className="p-5">
              <p className="text-center text-xs font-semibold text-primary">0-100 市场情绪罗盘</p>
              <SentimentCompass pulse={pulse} />
              <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">{pulse?.signal}</p>
              <div className="mt-3 rounded-md bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">结构分化</span>
                  <span className="font-semibold">{pulse?.divergence_text} · {fmt(pulse?.divergence)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">指数动能</span><p className="mt-0.5 font-mono font-bold">{fmt(pulse?.index_score)}</p></div>
                  <div><span className="text-muted-foreground">个股广度</span><p className="mt-0.5 font-mono font-bold">{fmt(pulse?.breadth_score)}</p></div>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-muted-foreground">{pulse?.formula}</p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-bold"><BarChart3 className="h-4 w-4 text-primary" /> 九维情绪拆解</h2>
                <span className="text-[11px] text-muted-foreground">有效分项自动重分配权重</span>
              </div>
              <div className="grid gap-x-6 md:grid-cols-2">
                {(pulse?.components || []).map((item) => <ComponentMeter key={item.key} item={item} />)}
              </div>
            </GlassCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <GlassCard className="p-5">
              <h2 className="flex items-center gap-2 text-base font-bold"><Users className="h-4 w-4 text-primary" /> 今日散户情绪投票</h2>
              <p className="mt-1 text-xs text-muted-foreground">你认为下一交易日市场整体情绪会怎样？同一浏览器可修改选择。</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { key: "bull" as const, label: "偏多", icon: ThumbsUp, tone: "text-danger" },
                  { key: "neutral" as const, label: "震荡", icon: Minus, tone: "text-amber-400" },
                  { key: "bear" as const, label: "偏空", icon: ThumbsDown, tone: "text-success" },
                ].map(({ key, label, icon: Icon, tone }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={voting}
                    onClick={() => submitVote(key)}
                    className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-md border border-border bg-muted/20 text-sm hover:border-primary/50 hover:bg-muted/40 disabled:opacity-50"
                  >
                    <Icon className={cn("h-5 w-5", tone)} />
                    <span className="font-semibold">{label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{data?.votes?.counts?.[key] || 0} 票</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">当前样本 {data?.votes?.total || 0} / {data?.votes?.minimum_sample || 20}</span>
                <span className={cn("font-semibold", data?.votes?.sample_ready ? "text-primary" : "text-muted-foreground")}>
                  {data?.votes?.sample_ready ? `已纳入总分 · ${fmt(data?.votes?.score)}` : "达到门槛后纳入总分"}
                </span>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="flex items-center gap-2 text-base font-bold"><Gauge className="h-4 w-4 text-primary" /> 信号覆盖</h2>
              <p className="mt-1 text-xs text-muted-foreground">只把当前有可靠数据的信号计入罗盘，缺失项自动重分配权重。</p>
              <div className="mt-4 space-y-3">
                {(pulse?.coverage || []).map((item) => (
                  <div key={item.key} className="grid grid-cols-[20px_90px_1fr] items-start gap-2 text-xs">
                    {item.active ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-muted-foreground">{item.note}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <GlassCard className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold"><Activity className="h-4 w-4 text-primary" /> 市场脉搏</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["上涨家数", sentiment?.up], ["下跌家数", sentiment?.down],
                  ["涨停", emotion?.zt_count ?? sentiment?.zt_real], ["跌停", emotion?.dt_count ?? sentiment?.dt_real],
                  ["炸板", emotion?.zb_count], ["最高连板", emotion?.max_boards],
                  ["封板率", rate(emotion?.seal_rate)], ["晋级率", rate(emotion?.promotion_rate)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-md bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="mt-1 font-mono text-lg font-bold">{value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold"><RadioTower className="h-4 w-4 text-primary" /> 连板天梯</h2>
              {(emotion?.ladder || []).length ? (
                <div className="space-y-2">
                  {[...(emotion?.ladder || [])].reverse().map((tier) => (
                    <div key={`${tier.boards}-${tier.plus}`} className="grid grid-cols-[70px_1fr_48px] items-center gap-3">
                      <span className="text-xs font-semibold">{tier.boards}{tier.plus ? "+" : ""} 板</span>
                      <div className="h-2 overflow-hidden rounded bg-muted/60">
                        <div className="h-full rounded bg-danger" style={{ width: `${Math.min(100, tier.count * 12)}%` }} />
                      </div>
                      <span className="text-right font-mono text-xs text-muted-foreground">{tier.count} 家</span>
                    </div>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-muted-foreground">暂无有效连板梯队</p>}
            </GlassCard>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold"><Layers3 className="h-4 w-4 text-primary" /> 行业轮动</h2>
              <span className="text-[11px] text-muted-foreground">按行业资金净额排序</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard className="p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-danger"><ArrowUp className="h-3.5 w-3.5" /> 资金流入前列</p>
                <div className="space-y-2">
                  {sectorLeaders.map((item) => (
                    <div key={item.name} className="grid grid-cols-[1fr_70px_90px] gap-2 text-sm">
                      <span className="truncate">{item.name}</span>
                      <span className={cn("text-right font-mono", pctColor(item.pct))}>{item.pct > 0 ? "+" : ""}{item.pct}%</span>
                      <span className="text-right font-mono text-xs text-muted-foreground">净额 {item.net}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-success"><ArrowDown className="h-3.5 w-3.5" /> 资金流出前列</p>
                <div className="space-y-2">
                  {sectorLaggards.map((item) => (
                    <div key={item.name} className="grid grid-cols-[1fr_70px_90px] gap-2 text-sm">
                      <span className="truncate">{item.name}</span>
                      <span className={cn("text-right font-mono", pctColor(item.pct))}>{item.pct > 0 ? "+" : ""}{item.pct}%</span>
                      <span className="text-right font-mono text-xs text-muted-foreground">净额 {item.net}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold"><MessageSquareText className="h-4 w-4 text-primary" /> 公开观点雷达</h2>
                <p className="mt-1 text-xs text-muted-foreground">{data?.opinions?.source_count || 0} 个专业观点源 · 最近刷新 {data?.opinions?.generated_at || "尚未刷新"}</p>
              </div>
              <button
                type="button"
                onClick={refreshOpinions}
                disabled={refreshingOpinions}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {refreshingOpinions ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {refreshingOpinions ? "正在抓取" : "刷新观点"}
              </button>
            </div>

            <GlassCard className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                <div className="flex gap-1 rounded-md bg-muted/40 p-1">
                  {(["全部", "偏多", "中性", "偏空"] as OpinionFilter[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={cn("rounded px-3 py-1.5 text-xs", filter === item ? "bg-background font-semibold text-primary" : "text-muted-foreground")}
                    >
                      {item}{item === "全部" ? "" : ` ${data?.opinions?.counts?.[item] ?? 0}`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">观点偏向 {data?.opinions?.consensus && data.opinions.consensus > 0 ? "+" : ""}{data?.opinions?.consensus ?? 0}</p>
              </div>
              {opinions.length ? opinions.map((item) => <OpinionRow key={`${item.source}-${item.time}-${item.title}`} item={item} />) : (
                <p className="py-10 text-center text-sm text-muted-foreground">暂无匹配观点。点击“刷新观点”重抓公开 RSS 源。</p>
              )}
              <p className="mt-4 border-t border-border/50 pt-3 text-[11px] leading-5 text-muted-foreground">{data?.opinions?.method}</p>
            </GlassCard>
          </section>

          <section className="rounded-lg border border-border/70 bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
            <p><b className="text-foreground">行情来源：</b>{data?.sources?.market}</p>
            <p><b className="text-foreground">观点来源：</b>{data?.sources?.opinions}</p>
            <p><b className="text-foreground">刷新口径：</b>{data?.sources?.cache}</p>
            <p className="mt-1">数据时间：{data?.as_of || "—"}。观点立场由关键词机械分类，只用于观察叙事方向，不判断观点真伪，也不预测涨跌。</p>
          </section>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
