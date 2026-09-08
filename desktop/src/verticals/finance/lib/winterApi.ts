// Winter 定制页的兼容数据层。新版编排器与旧 FastAPI 使用不同端口，不在一个 api 客户端里混用。

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const ACCESS_KEY = "vr-access-key";
const ENV_API_URL = ((import.meta as unknown as { env?: { VITE_LEGACY_API_URL?: string } }).env?.VITE_LEGACY_API_URL || "").trim();
const API_BASE = ENV_API_URL || (typeof window !== "undefined" && ["127.0.0.1", "localhost"].includes(window.location.hostname)
  ? "http://127.0.0.1:8900"
  : "");

function authHeaders(): Record<string, string> {
  try {
    const key = localStorage.getItem(ACCESS_KEY) || "";
    return key ? { Authorization: `Bearer ${key}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders() };
  const options: RequestInit = { method };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  if (Object.keys(headers).length) options.headers = headers;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api${path}`, options);
  } catch {
    throw new ApiError("连接不到 Winter 兼容服务（本地 8900）", 0);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload
      ? String((payload as { detail?: unknown }).detail)
      : `HTTP ${response.status}`;
    throw new ApiError(detail, response.status);
  }
  return ((payload && typeof payload === "object" && "data" in payload)
    ? (payload as { data: T }).data
    : payload) as T;
}

export interface IndexQuote {
  name: string; price: number; change_pct: number; change_amt: number;
}
export interface MarketSentiment {
  up: number; down: number; flat: number; zt: number; zt_real: number; dt: number; dt_real: number;
  active: string; breadth: string; speculation: string; date: string;
}
export interface SectorFlow {
  name: string; pct: number; net: number; inflow: number; outflow: number; firms: number;
}
export interface MarketOverview {
  sentiment: MarketSentiment; sectors: SectorFlow[]; updated: string;
}
export interface EmotionTier { boards: number; count: number; plus: boolean }
export interface LianbanStock {
  code: string; name: string; boards: number; price: number; pct: number;
  amount: number | null; float_cap: number | null; industry: string;
}
export interface ShortTermEmotion {
  date: string; zt_count: number; dt_count: number; zb_count: number;
  max_boards: number; lianban_count: number; ladder: EmotionTier[];
  lianban_stocks: LianbanStock[]; seal_rate: number | null; break_rate: number | null;
  promotion_rate: number | null; yzt_count: number;
}
export interface SentimentComponent {
  key: string; label: string; value: number | null; weight: number; note: string;
}
export interface SentimentBand {
  min: number; max: number; label: string; color: string; meaning: string;
}
export interface SentimentCoverage {
  key: string; label: string; active: boolean; note: string;
}
export interface SentimentPulse {
  score: number | null; phase: string; signal: string; components: SentimentComponent[];
  band: SentimentBand | null; bands: SentimentBand[]; coverage: SentimentCoverage[];
  breadth_score: number | null; index_score: number | null; index_avg_change: number | null;
  divergence: number | null; divergence_text: string; formula: string;
}
export interface SentimentVotes {
  counts: Record<"bull" | "neutral" | "bear", number>;
  total: number; score: number | null; sample_ready: boolean; minimum_sample: number; method: string;
}
export interface OpinionItem {
  title: string; url: string; time: string; source: string; summary: string; industry: string;
  stance: "偏多" | "中性" | "偏空"; confidence: number;
}
export interface OpinionFeed {
  generated_at: string | null; items: OpinionItem[];
  counts: Record<"偏多" | "中性" | "偏空", number>;
  consensus: number; source_count: number; method: string;
}
export interface SentimentDashboardData {
  as_of: string; indices: IndexQuote[]; overview: MarketOverview; emotion: ShortTermEmotion;
  pulse: SentimentPulse; opinions: OpinionFeed; votes: SentimentVotes;
  sources: { market: string; opinions: string; cache: string };
}

export interface ResearchReport {
  title: string; date: string; segment: string; source: string;
  type?: string; org?: string; path?: string; pdfUrl?: string | null; size?: number;
}
export interface SerenityLeader {
  name: string; code: string; molecule: string; dims: number[]; total: number; tier: string;
  note: string; source: string;
  quote: { price?: number; change_pct?: number; pe_ttm?: number; pb?: number; mcap_yi?: number };
}
export interface ResearchLibrary {
  as_of: string; local_count: number; online_count: number;
  local_reports: ResearchReport[]; online_reports: ResearchReport[]; leaders: SerenityLeader[];
  keywords: string[];
}

export const winterApi = {
  researchLibrary: () => request<ResearchLibrary>("/research/library"),
  sentimentDashboard: () => request<SentimentDashboardData>("/sentiment/dashboard"),
  sentimentRefreshOpinions: () => request<SentimentDashboardData>("/sentiment/refresh-opinions", "POST"),
  sentimentVote: (choice: "bull" | "neutral" | "bear", voterToken: string) =>
    request<SentimentVotes>("/sentiment/vote", "POST", { choice, voter_token: voterToken }),
};
