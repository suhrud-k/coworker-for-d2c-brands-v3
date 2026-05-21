# CoWorker for D2C — v3 (chat-first AI finance team)

v3 is a **separate product** from `coworker-for-d2c-brands_v2`. It reframes CoWorker as a chat-first dashboard with an AI CFO (Veera) and four reporting agents, each with their own office under **Manage my team**.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (Vite dev server via `server.ts`).

## Shell

- **Home** — greeting, priority action cards, embedded team chat
- **Connections** — data source connectors (ported from v2)
- **Manage my team** — roster, policies, counterparts, contacts, activity, escalations, and per-agent offices

## Demo priority

- **Veera** and **Priya** offices are fully populated (all office tabs)
- **Rohan**, **Maya**, **Ankita** — office shell + at least one real tab each; other tabs show placeholders

## Spec

See `Requirements/Prompt_v3_DashboardRedesign.md` and `../CoWorker_AI_Team_JobProfiles_v1.md`.
