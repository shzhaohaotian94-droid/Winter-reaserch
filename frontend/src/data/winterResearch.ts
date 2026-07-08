import { Cpu, Cog, Cable, Database, Layers3, Thermometer, Zap, Hand, Gauge, ScanSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SerenityDimension = {
  name: string;
  weight: number;
  description: string;
};

export type WinterSector = {
  key: string;
  title: string;
  thesis: string;
  icon: LucideIcon;
  route: string;
  segments: string[];
  serenity: {
    bottleneck: string;
    localization: string;
    catalyst: string;
    risk: string;
  };
};

export const serenityDimensions: SerenityDimension[] = [
  { name: "物理卡口", weight: 1.8, description: "是否处在产能、工艺、材料或设备的硬约束位置。" },
  { name: "国产替代", weight: 1.5, description: "是否受益于供应链安全和本土替代。" },
  { name: "下游刚需", weight: 1.5, description: "需求是否来自不可绕开的产业升级。" },
  { name: "市场空间", weight: 1.4, description: "赛道容量、渗透率和量价弹性。" },
  { name: "催化剂", weight: 1.4, description: "业绩、订单、政策、产品节点是否清晰。" },
  { name: "动态 PEG", weight: 1.4, description: "估值能否被中期成长消化。" },
  { name: "认知差", weight: 1.0, description: "市场是否还没有充分理解卡口价值。" },
];

export const winterSectors: WinterSector[] = [
  {
    key: "humanoid",
    title: "人形机器人",
    thesis: "旧看板已搭出产业链框架：本体机器人需求端向减速器、丝杠、电机、传感器、灵巧手等核心环节传导。",
    icon: Cog,
    route: "/sectors/humanoid",
    segments: ["谐波减速器", "行星滚柱丝杠", "无框力矩电机", "六维力传感器", "灵巧手", "滚珠丝杠"],
    serenity: {
      bottleneck: "精密传动、微型执行器与力控反馈是物理世界落地的关键卡口。",
      localization: "国产供应链具备成本和响应速度优势，但高端一致性仍需验证。",
      catalyst: "量产节奏、整机 BOM 降本、海外龙头发布会和大客户定点。",
      risk: "商业化慢于预期、样机热度高于订单兑现、核心零部件价格战。",
    },
  },
  {
    key: "ai-computing",
    title: "AI 算力",
    thesis: "旧看板把 AI 算力拆成芯片、存储、光互联、PCB、交换、液冷、MLCC、玻璃基板与上游卡口材料。",
    icon: Cpu,
    route: "/sectors/ai-computing",
    segments: ["AI 芯片", "HBM", "光模块", "PCB", "交换芯片", "液冷散热", "MLCC", "玻璃基板", "上游卡口材料"],
    serenity: {
      bottleneck: "先进封装、光互联、高端材料和散热共同决定集群效率。",
      localization: "美国出口限制强化国产替代逻辑，材料和设备环节更符合卡口筛选。",
      catalyst: "云厂商资本开支、国产算力集群、GB/ASIC 产业链订单。",
      risk: "算力投资周期波动、供给扩张、单一客户和技术路线切换。",
    },
  },
  {
    key: "optical",
    title: "光模块 / 光互联",
    thesis: "旧看板单列光模块入口，适合作为 AI 算力中的高弹性分支继续做深。",
    icon: Cable,
    route: "/sectors/cpo",
    segments: ["800G/1.6T 光模块", "CPO", "硅光", "光芯片", "高速连接器"],
    serenity: {
      bottleneck: "带宽墙和功耗墙推高高速光互联价值量。",
      localization: "国内厂商在模块制造强，核心芯片和高端材料仍需跟踪。",
      catalyst: "海外 AI 集群迭代、交换机升级、1.6T 量产节奏。",
      risk: "海外客户库存周期、价格下行、技术路线替代。",
    },
  },
  {
    key: "materials",
    title: "上游卡口材料",
    thesis: "旧看板中 Serenity 最完整的一块，重点关注 WF6、球硅、GMC、CMP、靶材等高端材料分子。",
    icon: Layers3,
    route: "/sectors/semiconductor",
    segments: ["电子特气", "球形硅微粉", "GMC", "CMP 材料", "靶材", "先进封装材料"],
    serenity: {
      bottleneck: "材料认证周期长、配方 know-how 强，往往是隐蔽但硬的卡口。",
      localization: "半导体和 AI 供应链安全带来长期替代窗口。",
      catalyst: "新产线验证、先进封装放量、国产晶圆厂材料导入。",
      risk: "验证周期不确定、客户集中、扩产后价格承压。",
    },
  },
];

export const winterWatchDefaults = ["600519", "300750", "688256", "002371"];

export const winterPrinciples = [
  { icon: ScanSearch, title: "先找卡口", text: "从产业链约束入手，而不是先看短期涨跌。" },
  { icon: Database, title: "数据留痕", text: "自选、持仓、笔记和 AI 输出都沉淀在本地。" },
  { icon: Gauge, title: "分层评分", text: "板块看确定性，环节看壁垒，个股再看估值和兑现。" },
  { icon: Thermometer, title: "排雷优先", text: "价格、估值、订单、客户集中度和政策风险要先过筛。" },
  { icon: Zap, title: "催化跟踪", text: "把订单、财报、产品节点和政策事件变成跟踪清单。" },
  { icon: Hand, title: "不自动决策", text: "看板只整理研究材料，不替代你的判断。" },
];
