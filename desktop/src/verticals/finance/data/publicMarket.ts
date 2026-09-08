import type { GlobalIndex, IndexQuote, Quote } from "@/lib/api";

export const publicIndexSnapshot: IndexQuote[] = [
  { name: "上证指数", price: 3498.82, change_pct: -0.01, change_amt: -0.35 },
  { name: "深证成指", price: 10511.95, change_pct: 0.39, change_amt: 40.86 },
  { name: "创业板指", price: 2145.86, change_pct: 0.53, change_amt: 11.32 },
  { name: "沪深300", price: 4014.58, change_pct: 0.25, change_amt: 10.01 },
];

export const publicGlobalIndexSnapshot: GlobalIndex[] = [
  { key: "DJIA", name: "道琼斯", region: "US", price: 44502.44, change_pct: -0.37 },
  { key: "IXIC", name: "纳斯达克", region: "US", price: 20565.88, change_pct: 0.03 },
  { key: "SPX", name: "标普500", region: "US", price: 6225.52, change_pct: -0.07 },
  { key: "HSI", name: "恒生指数", region: "HK", price: 24148.07, change_pct: 1.09 },
];

export const publicQuoteSnapshot: Record<string, Quote> = {
  "688146": {
    name: "中船特气",
    market: "CN",
    currency: "CNY",
    price: 329.5,
    last_close: 343.86,
    change_pct: -4.28,
    pe_ttm: 484.38,
    pb: 30.26,
    mcap_yi: 1744,
    turnover_pct: 3.4,
    limit_up: 412.63,
    limit_down: 275.09,
    float_mcap_yi: null,
    amount_yuan: null,
  },
  "688019": {
    name: "安集科技",
    market: "CN",
    currency: "CNY",
    price: 317.96,
    last_close: 300.04,
    change_pct: 5.98,
    pe_ttm: 87.94,
    pb: 16.87,
    mcap_yi: 410,
    turnover_pct: 4.1,
    limit_up: 360.05,
    limit_down: 240.03,
    float_mcap_yi: null,
    amount_yuan: null,
  },
  "688300": {
    name: "联瑞新材",
    market: "CN",
    currency: "CNY",
    price: 72.8,
    last_close: 71.6,
    change_pct: 1.68,
    pe_ttm: 68.4,
    pb: 9.2,
    mcap_yi: 135,
    turnover_pct: 2.1,
    limit_up: 85.92,
    limit_down: 57.28,
    float_mcap_yi: null,
    amount_yuan: null,
  },
  "300054": {
    name: "鼎龙股份",
    market: "CN",
    currency: "CNY",
    price: 28.4,
    last_close: 27.82,
    change_pct: 2.09,
    pe_ttm: 56.1,
    pb: 4.8,
    mcap_yi: 268,
    turnover_pct: 1.9,
    limit_up: 33.38,
    limit_down: 22.26,
    float_mcap_yi: null,
    amount_yuan: null,
  },
};

export const publicMarketSnapshotAsOf = "2026-07-08";
