import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve("dist");
const indexPath = resolve(distDir, "index.html");
const indexHtml = await readFile(indexPath, "utf8");
const sectorData = JSON.parse(await readFile(resolve("src/data/sectors.json"), "utf8"));

const routes = [
  "winter",
  "research-library",
  "daily-review",
  "sentiment",
  "industry-news",
  "intel",
  "sectors",
  "portfolio",
  "stock-data",
  "notes",
  "settings",
  ...sectorData.sectors.map((sector) => `sectors/${sector.key}`),
];

await cp(indexPath, resolve(distDir, "404.html"));

for (const route of routes) {
  const routeDir = resolve(distDir, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(resolve(routeDir, "index.html"), indexHtml);
}
