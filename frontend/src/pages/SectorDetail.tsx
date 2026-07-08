import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Wrench, Boxes, FlaskConical, Target, Gauge, Tags } from "lucide-react";
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
