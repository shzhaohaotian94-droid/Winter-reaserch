import { useMemo, useState } from "react";
import { Activity, CalendarRange, ExternalLink, Flame, Swords } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

const VIEWS = [
  { path: "agent/review", label: "复盘看板", icon: Swords },
  { path: "daily-review", label: "盘面数据", icon: Activity },
  { path: "first-board", label: "首板分析", icon: Flame },
  { path: "heat", label: "近5天热度", icon: CalendarRange },
];

function astockUrl(path: string) {
  const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
  if (isLocal) return `http://127.0.0.1:8910/?embed=1#/${path}`;
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${base.endsWith("/") ? "" : "/"}astock/?embed=1#/${path}`;
}

export function AstockWorkbench() {
  const [view, setView] = useState(VIEWS[0]!.path);
  const src = useMemo(() => astockUrl(view), [view]);

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="短线复盘"
        subtitle="Vibe-Astock · 收盘事实、赚钱效应、晋级率、梯队结构与五日题材热度"
        actions={
          <a href={src.replace("?embed=1", "")} target="_blank" rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-4 w-4" /> 独立打开
          </a>
        }
      />
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-md border border-border bg-muted/20 p-1" role="tablist" aria-label="短线复盘栏目">
        {VIEWS.map(({ path, label, icon: Icon }) => (
          <button key={path} type="button" role="tab" aria-selected={view === path} onClick={() => setView(path)}
            className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded px-3 text-sm transition-colors",
              view === path ? "bg-background font-semibold text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="min-h-[760px] flex-1 overflow-hidden rounded-md border border-border bg-background">
        <iframe key={src} src={src} title={`短线复盘 - ${VIEWS.find((item) => item.path === view)?.label}`}
          className="h-[calc(100vh-170px)] min-h-[760px] w-full border-0" />
      </div>
    </div>
  );
}
