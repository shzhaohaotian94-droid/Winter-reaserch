# Vibe-Astock integration

Upstream: `https://github.com/simonlin1212/Vibe-Astock`

The upstream repository is pinned under `integrations/vibe-astock` with Git subtree. Winter Research exposes it as the left-nav item `短线复盘` at `/astock`.

## Included views

- 复盘看板：赚钱效应、亏钱效应、晋级率、连板溢价、梯队与情绪周期。
- 盘面数据：指数、外围、板块资金与实时打板情绪。
- 首板分析：首板池与封板结构。
- 近5天热度：题材热度与龙头谱系。

The embedded UI hides Vibe-Astock's duplicate sidebar. `独立打开` retains the complete upstream application.

## Local runtime

`start-winter-research.ps1` starts:

- Winter frontend: `http://127.0.0.1:5899`
- Winter API: `http://127.0.0.1:8900`
- Vibe-Astock application/API: `http://127.0.0.1:8910`

The Windows launcher uses the already signed-in Codex subscription for AI review generation. Codex runs from an empty temporary directory with `--sandbox read-only --ephemeral`; it cannot write project files and does not persist one session per analysis call.

## Public deployment

GitHub Actions builds Vibe-Astock at `/Winter-reaserch/astock/`. Configure the repository variable `VITE_ASTOCK_API_URL` with the public Vibe-Astock backend URL. `render.yaml` defines the `vibe-astock-api` service for that backend.

## Updating upstream

Run:

```powershell
.\scripts\update-vibe-astock.ps1
```

Review local integration patches after every upstream pull, especially `server.py`, `frontend/src/router.tsx`, `frontend/src/lib/base.ts`, and embedded layout handling.
