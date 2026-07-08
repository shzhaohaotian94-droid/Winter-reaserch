import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { api, type ResearchLibrary as ResearchLibraryData, type ResearchReport, type SerenityLeader } from "@/lib/api";
import { cn } from "@/lib/utils";
import { publicResearchFallback } from "@/data/publicResearch";

const dimNames = ["物理卡口", "国产替代", "下游刚需", "市场空间", "催化剂", "动态PEG", "认知差"];
const tierStyle: Record<string, string> = {
  S: "border-red-500/40 bg-red-500/10 text-red-400",
  A: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  B: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  C: "border-muted bg-muted/30 text-muted-foreground",
  出局: "border-muted bg-muted/30 text-muted-foreground",
};

function pctColor(v?: number) {
  return v == null ? "text-muted-foreground" : v > 0 ? "text-danger" : v < 0 ? "text-success" : "text-muted-foreground";
}

function ReportList({ title, reports, empty }: { title: string; reports: ResearchReport[]; empty: string }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{reports.length} 条</span>
      </div>
      <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
        {reports.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
        ) : reports.map((r, idx) => (
          <div key={`${r.title}-${idx}`} className="rounded-lg bg-muted/25 p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>{r.date || "—"}</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{r.segment || "未分类"}</span>
              <span>{r.org || r.type || r.source}</span>
            </div>
            <p className="text-sm font-medium leading-5">{r.title}</p>
            {r.path && <p className="mt-1 truncate text-[11px] text-muted-foreground/70" title={r.path}>{r.path}</p>}
            {r.pdfUrl && (
              <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                PDF <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function LeaderCard({ leader }: { leader: SerenityLeader }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">{leader.name} <span className="font-mono text-xs text-muted-foreground">{leader.code}</span></h3>
          <p className="mt-1 text-xs text-muted-foreground">{leader.molecule}</p>
        </div>
        <div className={cn("rounded-lg border px-2.5 py-1 text-center", tierStyle[leader.tier] || tierStyle.C)}>
          <p className="text-xs">评级</p>
          <p className="font-bold">{leader.tier} · {leader.total.toFixed(1)}</p>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-muted/25 p-2">
          <p className="text-muted-foreground">价格</p>
          <p className="font-mono">{leader.quote.price ?? "—"}</p>
        </div>
        <div className="rounded bg-muted/25 p-2">
          <p className="text-muted-foreground">涨跌</p>
          <p className={cn("font-mono", pctColor(leader.quote.change_pct))}>
            {leader.quote.change_pct == null ? "—" : `${leader.quote.change_pct > 0 ? "+" : ""}${leader.quote.change_pct}%`}
          </p>
        </div>
        <div className="rounded bg-muted/25 p-2">
          <p className="text-muted-foreground">PE/PB</p>
          <p className="font-mono">{leader.quote.pe_ttm ?? "—"} / {leader.quote.pb ?? "—"}</p>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {leader.dims.map((v, i) => (
          <div key={dimNames[i]} className="flex items-center justify-between rounded bg-muted/20 px-2 py-1 text-xs">
            <span className="text-muted-foreground">{dimNames[i]}</span>
            <span className="font-mono text-foreground">{v}</span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{leader.note}</p>
      <p className="mt-2 text-[11px] text-muted-foreground/60">{leader.source}</p>
    </GlassCard>
  );
}

export function ResearchLibrary() {
  const [data, setData] = useState<ResearchLibraryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [segment, setSegment] = useState("全部");

  const load = () => {
    setLoading(true);
    setErr("");
    api.researchLibrary()
      .then(setData)
      .catch((e) => {
        setData(publicResearchFallback);
        setErr(e instanceof Error ? `已进入公开静态模式：${e.message}` : "已进入公开静态模式");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const segments = useMemo(() => {
    const set = new Set<string>();
    [...(data?.local_reports || []), ...(data?.online_reports || [])].forEach((r) => r.segment && set.add(r.segment));
    return ["全部", ...Array.from(set)];
  }, [data]);

  const local = (data?.local_reports || []).filter((r) => segment === "全部" || r.segment === segment);
  const online = (data?.online_reports || []).filter((r) => segment === "全部" || r.segment === segment);

  return (
    <div>
      <PageHeader
        title="研报与 Serenity 评分"
        subtitle={`本地思考目录 + 东方财富最新研报；在线研报日期截止 ${data?.as_of || "今天"}`}
        actions={
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-primary/15 px-3 py-2 text-sm text-primary hover:bg-primary/25">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            刷新研报
          </button>
        }
      />

      <GlassCard className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Serenity v3 执行规则</span>
          <span className="text-xs text-muted-foreground">三层拆解 → 4 个物理追问 → 7 维评分 → 三红灯排雷。不确定数据标“—”，不编造。</span>
        </div>
      </GlassCard>

      {err && <GlassCard className="mb-5 border-warning/40 p-4 text-sm text-warning">{err}</GlassCard>}

      <div className="mb-4 flex flex-wrap gap-2">
        {segments.map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={cn("rounded-full border px-3 py-1 text-xs transition-colors", segment === s ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:text-foreground")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ReportList title="本地研报 / 笔记索引" reports={local} empty="未在思考目录里找到匹配研报" />
        <ReportList title="最新在线研报" reports={online} empty={loading ? "正在拉取最新研报…" : "未拉到匹配的在线研报，可稍后刷新"} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5 text-primary" /> 上游卡口材料龙头评分</h2>
        <span className="text-xs text-muted-foreground">评分底稿来自旧看板 + Serenity v3，行情实时拉取</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(data?.leaders || []).map((leader) => <LeaderCard key={leader.code} leader={leader} />)}
      </div>

      <Disclaimer />
    </div>
  );
}
