import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const store = fs.readFileSync(new URL("../src/verticals/finance/lib/persistentState.ts", import.meta.url), "utf8");
const debate = fs.readFileSync(new URL("../src/verticals/finance/pages/Debate.tsx", import.meta.url), "utf8");
const daily = fs.readFileSync(new URL("../src/verticals/finance/pages/DailyReview.tsx", import.meta.url), "utf8");
const intel = fs.readFileSync(new URL("../src/verticals/finance/pages/Intel.tsx", import.meta.url), "utf8");
const research = fs.readFileSync(new URL("../src/verticals/finance/pages/Research.tsx", import.meta.url), "utf8");
const stock = fs.readFileSync(new URL("../src/verticals/finance/pages/StockData.tsx", import.meta.url), "utf8");
const backtest = fs.readFileSync(new URL("../src/verticals/finance/pages/Backtest.tsx", import.meta.url), "utf8");

test("页面状态使用独立命名空间、同页订阅和安全存储", () => {
  assert.match(store, /vibe\.finance\.page-state\.v1:/);
  assert.match(store, /listeners\.get\(key\)/);
  assert.match(store, /storageSet\(storageKey\(key\), JSON\.stringify\(value\)\)/);
  assert.match(store, /storageRemove\(storageKey\(key\)\)/);
});

test("主要研究页面保留输入、生成结果与数据快照", () => {
  assert.match(debate, /usePersistentState<StageBox\[]>\("debate\.stages"/);
  assert.match(debate, /activeDebateController/);
  assert.match(daily, /usePersistentState\("daily\.review"/);
  assert.match(intel, /usePersistentState<Record<string, Digest>>\("intel\.digests"/);
  assert.match(research, /usePersistentState<ResearchStatus \| null>\("research\.active"/);
  assert.match(stock, /usePersistentState<Valuation \| null>\("stock\.valuation"/);
  assert.match(backtest, /usePersistentState<Message\[]>\("backtest\.messages"/);
});
