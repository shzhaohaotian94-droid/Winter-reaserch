import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Wrench, Boxes, FlaskConical, Target, Gauge, Tags, Network, RadioTower } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AskAiButton } from "@/components/ui/AskAiButton";
import { Disclaimer } from "@/components/ui/Disclaimer";
import sectorsData from "@/data/sectors.json";

type SubSector = {
  key: string;
  label: string;
  positioning: string;
  barrier: string;
  serenity?: number[];
  molecules?: string[];
  targets?: string[];
};

type ResearchTag = {
  key: string;
  label: string;
  status?: string;
  description?: string;
};

type OverviewSection = {
  title: string;
  bullets: string[];
};

type GenerationStep = {
  stage: string;
  status: string;
  role: string;
  note: string;
};

type MarketSizing = {
  metric: string;
  value: string;
  year: string;
  source: string;
  note: string;
};

type ResearchOverview = {
  title: string;
  asOf: string;
  thesis: string;
  sections: OverviewSection[];
  generationMap: GenerationStep[];
  marketSizing: MarketSizing[];
  sources: { label: string; url: string }[];
};

type TechGeneration = {
  generation: string;
  status: string;
  moduleRate: string;
  perLambda: string;
  channels: string;
  modulation: string;
  keyChange: string;
};

type ChainSegment = {
  order: number;
  title: string;
  examples: string[];
  role: string;
};

type BottleneckRank = {
  rank: number;
  segment: string;
  hardness: string;
  reason: string;
};

type TechChain = {
  title: string;
  asOf: string;
  thesis: string;
  generations: TechGeneration[];
  chain: ChainSegment[];
  bottlenecks: BottleneckRank[];
  hardestBottleneck: {
    segment: string;
    conclusion: string;
    reasons: string[];
  };
  sources: { label: string; url: string }[];
};

type LeaderSegment = {
  segment: string;
  grade: "海外主导" | "中外混合" | "中国已建立壁垒";
  globalDominance: string;
  leadingRegions: string[];
  globalPlayers: string[];
  chinaPlayers: string[];
  chinaTier: string;
  barrier: string;
  chinaPosition: string;
  conclusion: string;
};

type LeaderLandscape = {
  title: string;
  asOf: string;
  thesis: string;
  segments: LeaderSegment[];
  chinaFirstTier: string[];
  chinaBottlenecks: string[];
  sources: { label: string; url: string }[];
};

type CpoIncrement = {
  name: string;
  whyNew: string;
  bottleneck: string;
};

type CpoPhase = {
  phase: string;
  timing: string;
  meaning: string;
  signal: string;
};

type CpoRoute = {
  title: string;
  asOf: string;
  definition: string;
  increments: CpoIncrement[];
  hardestBottleneck: {
    material: string;
    conclusion: string;
    reasons: string[];
  };
  phases: CpoPhase[];
  replacement: {
    conclusion: string;
    details: string[];
  };
  sources: { label: string; url: string }[];
};

type BottleneckLeader = {
  bottleneck: string;
  position: string;
  globalLeaders: string[];
  chinaLeaders: string[];
  preferredTargets: string[];
  serenity: number[];
  rating: string;
  reason: string;
  caveat: string;
};

type BottleneckLeaderSummary = {
  title: string;
  asOf: string;
  scoringNote: string;
  leaders: BottleneckLeader[];
};

const sumScore = (dims?: number[]) => (dims || []).reduce((acc, n) => acc + n, 0);
const tierOf = (score: number) => (score >= 8.5 ? "S" : score >= 7 ? "A" : score >= 5.5 ? "B" : score >= 4 ? "C" : "出局");

function ChipList({ items, tone = "default" }: { items?: string[]; tone?: "default" | "target" }) {
  if (!items?.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={
            tone === "target"
              ? "rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
              : "rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SubSectorCard({ item }: { item: SubSector }) {
  const score = sumScore(item.serenity);
  return (
    <GlassCard className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold">
            <Boxes className="h-4 w-4 text-primary" />
            {item.label}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.positioning}</p>
        </div>
        {item.serenity && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-right">
            <div className="text-xs text-muted-foreground">Serenity</div>
            <div className="text-lg font-extrabold text-primary">{score.toFixed(1)} {tierOf(score)}</div>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> 卡口逻辑
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{item.barrier}</p>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" /> 分子/环节
          </div>
          <ChipList items={item.molecules} />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> 标的索引
          </div>
          <ChipList items={item.targets} tone="target" />
        </div>
      </div>
    </GlassCard>
  );
}

function BottleneckLeaderSummaryPanel({ summary }: { summary: BottleneckLeaderSummary }) {
  const sorted = [...summary.leaders].sort((a, b) => sumScore(b.serenity) - sumScore(a.serenity));

  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">Serenity 龙头评分 · {summary.asOf}</p>
          <h2 className="mt-1 text-xl font-extrabold">{summary.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{summary.scoringNote}</p>
        </div>
        <Gauge className="h-6 w-6 text-primary" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sorted.map((item) => {
          const score = sumScore(item.serenity);
          return (
            <div key={item.bottleneck} className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-primary">{item.bottleneck}</p>
                  <h3 className="mt-1 text-base font-bold">{item.position}</h3>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-right">
                  <div className="text-[11px] text-muted-foreground">Serenity</div>
                  <div className="text-lg font-extrabold text-primary">{score.toFixed(1)} {tierOf(score)}</div>
                  <div className="text-[11px] text-muted-foreground">{item.rating}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">全球龙头</p>
                  <ChipList items={item.globalLeaders} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">中国映射</p>
                  <ChipList items={item.chinaLeaders} tone="target" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">优先跟踪</p>
                  <ChipList items={item.preferredTargets} tone="target" />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="rounded bg-muted/25 p-3 text-xs leading-5 text-muted-foreground">
                  <b className="text-foreground">评分理由：</b>{item.reason}
                </p>
                <p className="rounded bg-muted/25 p-3 text-xs leading-5 text-muted-foreground">
                  <b className="text-foreground">扣分项：</b>{item.caveat}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function OverviewPanel({ overview }: { overview: ResearchOverview }) {
  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">1 总览 · {overview.asOf}</p>
          <h2 className="mt-1 text-xl font-extrabold">{overview.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{overview.thesis}</p>
        </div>
        <Network className="h-6 w-6 text-primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {overview.sections.map((section) => (
          <div key={section.title} className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-bold">{section.title}</h3>
            <div className="space-y-2">
              {section.bullets.map((bullet) => (
                <p key={bullet} className="text-sm leading-6 text-muted-foreground">{bullet}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
          <RadioTower className="h-4 w-4 text-primary" /> 代际演进地图
        </h3>
        <div className="grid gap-3 lg:grid-cols-5">
          {overview.generationMap.map((step) => (
            <div key={step.stage} className="rounded-lg border border-primary/25 bg-primary/5 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{step.stage}</p>
                <span className="rounded bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">{step.status}</span>
              </div>
              <p className="text-xs font-medium text-foreground">{step.role}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold">市场量级</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {overview.marketSizing.map((item) => (
            <div key={item.metric} className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">{item.metric}</p>
              <p className="mt-1 text-lg font-extrabold text-primary">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.year} · {item.source}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 pt-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">引用来源</p>
        <div className="flex flex-wrap gap-2">
          {overview.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary"
            >
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function TechChainPanel({ techChain }: { techChain: TechChain }) {
  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">2 技术路线及产业链 · {techChain.asOf}</p>
          <h2 className="mt-1 text-xl font-extrabold">{techChain.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{techChain.thesis}</p>
        </div>
        <Boxes className="h-6 w-6 text-primary" />
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold">技术代际：400G → 800G → 1.6T → 3.2T</h3>
        <div className="grid gap-3 xl:grid-cols-4">
          {techChain.generations.map((item) => (
            <div key={item.generation} className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-lg font-extrabold text-primary">{item.generation}</p>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{item.status}</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <p><b className="text-foreground">模块速率：</b><span className="text-muted-foreground">{item.moduleRate}</span></p>
                <p><b className="text-foreground">单波速率：</b><span className="text-muted-foreground">{item.perLambda}</span></p>
                <p><b className="text-foreground">通道数：</b><span className="text-muted-foreground">{item.channels}</span></p>
                <p><b className="text-foreground">调制：</b><span className="text-muted-foreground">{item.modulation}</span></p>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.keyChange}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold">产业链链路图</h3>
        <div className="grid gap-3 lg:grid-cols-5">
          {techChain.chain.map((segment) => (
            <div key={segment.order} className="relative rounded-lg border border-primary/25 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{segment.order}</span>
                <h4 className="text-sm font-bold">{segment.title}</h4>
              </div>
              <ChipList items={segment.examples} />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{segment.role}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">从左到右：材料/衬底 → 光芯片和器件 → 光引擎/模块封装 → 系统集成 → AI 数据中心需求端。</p>
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold">卡口排序</h3>
        <div className="grid gap-3 lg:grid-cols-5">
          {techChain.bottlenecks.map((item) => (
            <div key={item.segment} className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold">#{item.rank} {item.segment}</p>
                <span className="rounded bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">{item.hardness}</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
        <p className="text-sm font-bold text-primary">最硬卡口：{techChain.hardestBottleneck.segment}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{techChain.hardestBottleneck.conclusion}</p>
        <div className="mt-3 space-y-1.5">
          {techChain.hardestBottleneck.reasons.map((reason) => (
            <p key={reason} className="text-xs leading-5 text-muted-foreground">{reason}</p>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 pt-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">引用来源</p>
        <div className="flex flex-wrap gap-2">
          {techChain.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary"
            >
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function LeaderLandscapePanel({ landscape }: { landscape: LeaderLandscape }) {
  const gradeClass: Record<LeaderSegment["grade"], string> = {
    海外主导: "border-red-500/35 bg-red-500/10 text-red-300",
    中外混合: "border-amber-500/35 bg-amber-500/10 text-amber-300",
    中国已建立壁垒: "border-primary/35 bg-primary/10 text-primary",
  };

  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">3 产业龙头 · {landscape.asOf}</p>
          <h2 className="mt-1 text-xl font-extrabold">{landscape.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{landscape.thesis}</p>
        </div>
        <Target className="h-6 w-6 text-primary" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {landscape.segments.map((item) => (
          <div key={item.segment} className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">{item.segment}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.globalDominance}</p>
              </div>
              <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${gradeClass[item.grade]}`}>
                {item.grade}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">主导地区/国家</p>
                <ChipList items={item.leadingRegions} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">海外代表</p>
                <ChipList items={item.globalPlayers} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">中国代表</p>
                <ChipList items={item.chinaPlayers} tone="target" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">中国梯队</p>
                <p className="text-xs leading-5 text-muted-foreground">{item.chinaTier}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded bg-muted/25 p-3">
                <p className="mb-1 text-xs font-semibold text-foreground">壁垒</p>
                <p className="text-xs leading-5 text-muted-foreground">{item.barrier}</p>
              </div>
              <div className="rounded bg-muted/25 p-3">
                <p className="mb-1 text-xs font-semibold text-foreground">中国位置</p>
                <p className="text-xs leading-5 text-muted-foreground">{item.chinaPosition}</p>
              </div>
              <div className="rounded bg-muted/25 p-3">
                <p className="mb-1 text-xs font-semibold text-foreground">结论</p>
                <p className="text-xs leading-5 text-muted-foreground">{item.conclusion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
          <h3 className="mb-3 text-sm font-bold text-primary">中国已进入全球第一梯队</h3>
          <div className="space-y-2">
            {landscape.chinaFirstTier.map((item) => (
              <p key={item} className="text-sm leading-6 text-muted-foreground">{item}</p>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="mb-3 text-sm font-bold text-red-300">仍被卡的关键环节</h3>
          <div className="space-y-2">
            {landscape.chinaBottlenecks.map((item) => (
              <p key={item} className="text-sm leading-6 text-muted-foreground">{item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 pt-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">引用来源</p>
        <div className="flex flex-wrap gap-2">
          {landscape.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary"
            >
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function CpoRoutePanel({ route }: { route: CpoRoute }) {
  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">4 CP0路线 · {route.asOf}</p>
          <h2 className="mt-1 text-xl font-extrabold">{route.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{route.definition}</p>
        </div>
        <Network className="h-6 w-6 text-primary" />
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold">纯增量品类：CP0 相比可插拔光模块新增的 5 个环节</h3>
        <div className="grid gap-3 lg:grid-cols-5">
          {route.increments.map((item) => (
            <div key={item.name} className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <h4 className="mb-2 text-sm font-bold text-primary">{item.name}</h4>
              <p className="text-xs leading-5 text-muted-foreground">{item.whyNew}</p>
              <p className="mt-3 rounded bg-muted/30 p-2 text-xs leading-5 text-muted-foreground">
                <b className="text-foreground">卡口：</b>{item.bottleneck}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <h3 className="text-sm font-bold text-red-300">最硬卡口：{route.hardestBottleneck.material}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{route.hardestBottleneck.conclusion}</p>
        <div className="mt-3 space-y-1.5">
          {route.hardestBottleneck.reasons.map((reason) => (
            <p key={reason} className="text-xs leading-5 text-muted-foreground">{reason}</p>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold">量产节奏：验证导入不等于全行业放量</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {route.phases.map((phase) => (
            <div key={phase.phase} className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold">{phase.phase}</h4>
                <span className="rounded bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">{phase.timing}</span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{phase.meaning}</p>
              <p className="mt-3 rounded bg-muted/30 p-2 text-xs leading-5 text-muted-foreground">
                <b className="text-foreground">跟踪信号：</b>{phase.signal}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
        <h3 className="text-sm font-bold text-primary">替代关系：下一代替代上一代</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{route.replacement.conclusion}</p>
        <div className="mt-3 space-y-1.5">
          {route.replacement.details.map((detail) => (
            <p key={detail} className="text-xs leading-5 text-muted-foreground">{detail}</p>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 pt-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">引用来源</p>
        <div className="flex flex-wrap gap-2">
          {route.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary"
            >
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}



export function SectorDetail() {
  const { key } = useParams();
  const sector = sectorsData.sectors.find((s) => s.key === key);

  if (!sector) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        未找到该板块。<Link to="/sectors" className="text-primary">返回板块中心</Link>
      </div>
    );
  }

  const subSectors = ((sector as unknown as { subSectors?: SubSector[] }).subSectors || []);
  const researchTags = ((sector as unknown as { tags?: ResearchTag[] }).tags || []);
  const bottleneckLeaderSummary = ((sector as unknown as { bottleneckLeaderSummary?: BottleneckLeaderSummary }).bottleneckLeaderSummary);
  const overview = ((sector as unknown as { overview?: ResearchOverview }).overview);
  const techChain = ((sector as unknown as { techChain?: TechChain }).techChain);
  const leaderLandscape = ((sector as unknown as { leaderLandscape?: LeaderLandscape }).leaderLandscape);
  const cpoRoute = ((sector as unknown as { cpoRoute?: CpoRoute }).cpoRoute);
  const aiContext =
    `板块：${sector.label}\n定位：${sector.tagline}\n产业链环节：` +
    (sector.nodes.length ? sector.nodes.join("、") : "（环节梳理中）") +
    (subSectors.length ? `\n细分：${subSectors.map((s) => s.label).join("、")}` : "");

  return (
    <div>
      <Link to="/sectors" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 板块中心
      </Link>

      <PageHeader
        title={sector.label}
        subtitle={sector.tagline}
        actions={
          <AskAiButton
            context={aiContext}
            label="让 AI 拆这个板块"
            suggestions={["按七维框架拆解", "这个板块的产业链地图", "哪个环节卡脖子", "有什么风险信号"]}
          />
        }
      />

      {sector.verified ? (
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">核心环节（{sector.nodes.length}）</h3>
            <div className="flex flex-wrap gap-2.5">
              {sector.nodes.map((n) => (
                <span key={n} className="rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1.5 text-sm font-medium text-foreground shadow-glow transition-colors hover:bg-primary/25">
                  {n}
                </span>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Plus className="h-3.5 w-3.5" /> 这里恢复的是旧看板的细分骨架，标的用于研究索引，不构成买卖建议。
            </p>
          </div>

          {bottleneckLeaderSummary && <BottleneckLeaderSummaryPanel summary={bottleneckLeaderSummary} />}

          {researchTags.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <Tags className="h-5 w-5 text-primary" /> 研究栏目
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {researchTags.map((tag) => (
                  <GlassCard key={tag.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold">{tag.label}</h3>
                      <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {tag.status === "empty" ? "空栏目" : tag.status || "整理中"}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {tag.description || "等待下一步指令填充内容页。"}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {overview && <OverviewPanel overview={overview} />}

          {techChain && <TechChainPanel techChain={techChain} />}

          {leaderLandscape && <LeaderLandscapePanel landscape={leaderLandscape} />}

          {cpoRoute && <CpoRoutePanel route={cpoRoute} />}

          {subSectors.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold">细分卡口</h2>
              <div className="grid gap-4">
                {subSectors.map((item) => (
                  <SubSectorCard key={item.key} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Wrench className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              该板块的环节骨架尚在<b className="text-foreground">实时核实</b>补全中。
            </p>
          </div>
        </GlassCard>
      )}

      <Disclaimer />
    </div>
  );
}
