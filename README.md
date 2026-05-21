# CoWorker for D2C — v3 (chat-first AI finance team)

v3 is a **separate product** from `coworker-for-d2c-brands_v2`. It reframes CoWorker as a chat-first dashboard with an AI CFO (Krishan) and four reporting agents, each with their own office under **Manage my team**.

**Repository:** https://github.com/suhrud-k/coworker-for-d2c-brands-v3

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (Vite dev server via `server.ts`).

## Deploy on Vercel (parallel to v2)

1. Vercel → **Add New** → **Project**
2. Import **`suhrud-k/coworker-for-d2c-brands-v3`** (not the v2 repo)
3. Leave **Production Branch** as **`main`** (default)
4. Framework: **Vite** · Build: `npm run build` · Output: `dist`
5. Deploy

Your existing v2 project can stay on `suhrud-k/coworker-for-d2c-brands` (`main`). No branch switching needed.

## Shell

- **Home** — greeting, priority action cards, embedded chat with Krishan
- **Connections** — data source connectors (ported from v2)
- **Manage my team** — roster, policies, counterparts, contacts, activity, escalations, and per-agent offices

## Spec

See `Requirements/Prompt_v3_DashboardRedesign.md` and `../CoWorker_AI_Team_JobProfiles_v1.md`.
