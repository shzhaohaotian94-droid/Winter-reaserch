# Winter Vibe-Research 工作记忆

本目录是为用户重新制作投资看板创建的工作根目录。

## 来源

- 上游开源仓库：`simonlin1212/Vibe-Research`
- 本地目录：`C:\Users\Administrator\Documents\Codex\2026-07-07\i-aiaiaiaiaiai-claude-code\work\Vibe-Research-Winter-src`
- 旧看板参考：`I:\AIAIAIAIAIAI\claude code\Vibe-Trading`
- 旧空项目参考：`I:\AIAIAIAIAIAI\claude code\大A投研看板`

## 已接入内容

- 新增 `Winter 看板` 首页：`frontend/src/pages/WinterDashboard.tsx`
- 新增旧看板研究记忆数据：`frontend/src/data/winterResearch.ts`
- 默认路由从 `/daily-review` 改为 `/winter`
- 侧边栏品牌改为 `Winter-Research`，并新增 `Winter 看板` 导航项
- 保留 Vibe-Research 原有页面：每日复盘、资讯雷达、板块中心、个股数据、持仓、研究记录、接入 AI

## 旧看板核心记忆

旧版 Vibe-Trading 看板的重要资产不是庞大的原后端，而是：

- Serenity 瓶颈投资法：物理卡口、国产替代、下游刚需、市场空间、催化剂、动态 PEG、认知差
- 人形机器人产业链：谐波减速器、行星滚柱丝杠、无框力矩电机、六维力传感器、灵巧手、滚珠丝杠
- AI 算力产业链：AI 芯片、HBM、光模块、PCB、交换芯片、液冷散热、MLCC、玻璃基板、上游卡口材料
- 总览页经验：A 股红涨绿跌、自选股存在本地、用户日常希望双击桌面图标打开

## 运行方式

推荐使用根目录的 `start-winter-research.bat`，它会启动后端 `8900`、前端 `5899`，然后打开 `http://localhost:5899/winter`。

桌面快捷方式已创建：`C:\Users\Administrator\Desktop\Winter Research Dashboard.lnk`。

首次启动默认安装 `backend/requirements-lite.txt`，足够支撑 Winter 首页、基础行情和看板壳。若要启用深度数据页的 akshare/mootdx/pandas 能力，再手动安装 `backend/requirements.txt`。

如需手动运行：

```powershell
cd backend
python -m uvicorn app:app --host 127.0.0.1 --port 8900

cd frontend
npm run dev -- --host 127.0.0.1 --port 5899
```

## 后续迭代建议

- 把旧 Vibe-Trading 的研报扫描逻辑改写为 Vibe-Research 的 `/api/sector-reports` 风格接口。
- 将 Serenity 评分从静态方法论升级为可编辑本地数据表。
- 将 AI 算力、人形机器人、光模块、上游材料做成独立可保存的研究模板。
