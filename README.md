<p align="center">
  <img width="400" height="400" alt="niffera_analytics_logo" src="https://github.com/user-attachments/assets/02314c23-648e-4532-a004-79c0b6cb2e83" />
</p>

<h1 align="center">Niffera Analytics</h1>

<div align="center">
  <p><strong>AI-powered on-chain trading terminal with risk analytics, wallet behavior insights, and Solana execution via Jupiter</strong></p>
  <p>
    Token analytics • Wallet profiling • AI agents • Jupiter swaps • API jobs & webhooks • Credit-based access
  </p>
</div>

---

## Quick Links

[![Web App](https://img.shields.io/badge/Web%20App-Open-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://your-web-app-link)
[![Docs](https://img.shields.io/badge/Docs-Read-8b5cf6?style=for-the-badge&logo=readthedocs&logoColor=white)](https://your-docs-link)
[![API](https://img.shields.io/badge/API-Explore-0f766e?style=for-the-badge&logo=fastapi&logoColor=white)](https://api.niffera.com/v1)
[![X.com](https://img.shields.io/badge/X.com-Follow-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/your_account)
[![Telegram Community](https://img.shields.io/badge/Telegram%20Community-Join-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/your_group)

> [!IMPORTANT]
> **Niffera Analytics** is a non-custodial platform. Your wallet stays in control, and every on-chain action still requires your explicit approval.

> [!TIP]
> The fastest way to understand the product is to run one token check and one wallet check from the same account, then compare the analytics view, AI commentary, and execution flow.

> [!NOTE]
> Solana is the live execution layer in the current version. Multi-chain analytics expansion is part of the roadmap and will be added progressively where data quality and routing are reliable.

> [!WARNING]
> All analytics, agent outputs, and market data should be treated as informational. Trading crypto is risky, prices move fast, and execution outcomes are never guaranteed.

> [!CAUTION]
> Swaps are routed through Jupiter and signed in your own wallet. Always verify token, size, slippage, and route details before confirming any transaction.

---

## The Primitive

Niffera Analytics is a **drop-in risk and execution intelligence block** for on-chain trading systems.

It combines three layers into one surface: a trader-facing terminal, AI agents for token and wallet interpretation, and an integration-ready backend with jobs and webhooks. In practice, that means a builder can use Niffera either as a full product interface or as a reusable analytics engine inside bots, dashboards, automations, and internal tools.

Instead of exposing only raw market data, Niffera is built around a more useful primitive for production systems: **risk-aware token and wallet decisioning**.

| Layer | What it does | Why it matters |
|---|---|---|
| Terminal layer | Token checks, wallet reads, PnL, exposure, swaps | Lets traders go from analysis to action in one place |
| Agent layer | Analytics Agent and Research Agent | Turns metrics and news into readable outputs |
| API layer | HTTP endpoints, async jobs, webhooks | Makes the same logic embeddable in external systems |

---

## Input → Output

A typical Niffera flow is simple: submit a token or wallet, let the engine calculate metrics and risk, then return a structured result that can be shown in UI or consumed by automation.

```text
Input
token_address + chain + timeframe

↓
Analytics engine
liquidity + volatility + holder structure + flow + execution risk

↓
Agent interpretation
summary + flags + trader-readable context

↓
Output
dashboard view, API payload, webhook event, or swap decision
```

### Concrete example

| Input | Internal processing | Output |
|---|---|---|
| Solana token address | Price, liquidity, volume, volatility, holder concentration, flow analysis | Risk summary, flags, metric payload, optional AI commentary |
| Wallet address | PnL history, drawdowns, exposure, behavioral patterns | Wallet profile, discipline/risk insights, current concentration view |
| Agent run request | Validation, queued job, async execution | `job_id`, status updates, final structured result |

This is the core logic of the product: **fit → integration → extension**.  
You start with a clear object, get a useful output fast, and then extend the same pattern into bots, workflows, and execution systems.

---

## Fastest Integration

The fastest integration path is the Agents API. You send a single request, receive a `job_id`, and then poll or wait for a webhook.

```bash
curl -X POST "https://api.niffera.com/v1/agents/run" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "token_analytics_v1",
    "input": {
      "token_address": "So11111111111111111111111111111111111111112",
      "chain": "solana",
      "timeframe": "24h"
    },
    "metadata": {
      "client_id": "builder-demo",
      "idempotency_key": "token-check-001"
    }
  }'
```

A successful call returns an async job handle:

```json
{
  "job_id": "job_01hv7p4t8t7dd3y0f7p9qkz9wq",
  "status": "queued",
  "agent_id": "token_analytics_v1",
  "created_at": "2026-03-06T12:00:00.000Z"
}
```

You can then fetch the result:

```bash
curl -X GET "https://api.niffera.com/v1/jobs/job_01hv7p4t8t7dd3y0f7p9qkz9wq" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### Minimal working example in TypeScript

```ts
import axios from "axios"

const client = axios.create({
  baseURL: "https://api.niffera.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.NIFFERA_API_KEY}`,
    "Content-Type": "application/json",
  },
})

async function runTokenCheck() {
  const run = await client.post("/agents/run", {
    agent_id: "token_analytics_v1",
    input: {
      token_address: "So11111111111111111111111111111111111111112",
      chain: "solana",
      timeframe: "24h",
    },
    metadata: {
      client_id: "builder-demo",
      idempotency_key: "token-check-001",
    },
  })

  const jobId = run.data.job_id

  while (true) {
    const job = await client.get(`/jobs/${jobId}`)

    if (job.data.status === "completed") {
      return job.data.result
    }

    if (job.data.status === "failed") {
      throw new Error(job.data.error?.message ?? "Job failed")
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

runTokenCheck()
  .then((result) => console.log(result))
  .catch((error) => console.error(error))
```

> [!IMPORTANT]
> Use API keys via environment variables or a secrets manager. Never hardcode production credentials in the repo.

---

## Common Embed Paths

Niffera is flexible because the same engine can sit behind multiple product shapes without changing the core request model.

### Backend / microservice

Use Niffera as a dedicated analytics dependency in your server stack. Your service receives user requests, calls the Agents API, stores results, and renders them into your own dashboards or risk workflows.

### Script / job

Use a scheduled script for repeated token checks, wallet monitoring, or daily behavioral reviews. This is a clean fit for cron jobs, CI runners, and one-shot operational scripts.

### Worker / queue

For higher volume workloads, use the async jobs model properly. Push agent runs from your queue, let workers track job state, and fan results into alerts or downstream systems once webhooks arrive.

### App / frontend

Use Niffera inside a frontend or internal console where a user needs fast reads on tokens and wallets. The web terminal can be the full destination, or your app can call the same backend directly and keep the UI custom.

| Embed path | Best fit | Typical outcome |
|---|---|---|
| Backend / microservice | Internal risk service or API product | Shared analytics layer for multiple apps |
| Script / job | Scheduled monitoring or one-off checks | Lightweight automation with low overhead |
| Worker / queue | High-throughput async processing | Reliable large-scale agent orchestration |
| App / frontend | Trader tools or internal dashboards | Interactive UX on top of structured analytics |

---

## Composable Parts

Niffera is easier to extend when treated as a system of reusable parts rather than one monolithic terminal.

### Core modules

| Module | Purpose |
|---|---|
| Token Analytics Engine | Computes liquidity, volume, volatility, holder concentration, flow, and execution risk |
| Wallet Analytics Engine | Computes PnL, drawdowns, exposure, trade behavior, and concentration patterns |
| Analytics Agent | Converts token or wallet metrics into a concise risk-aware explanation |
| Research Agent | Summarizes news, catalysts, narrative shifts, and context around a token or project |
| Jobs API | Handles async execution for heavier runs |
| Webhooks layer | Pushes completed events into your stack |
| Jupiter swap surface | Connects insight to manual execution on Solana |

### System sketch

```text
Wallet / Token input
        ↓
Analytics engine
        ↓
Agent layer
        ↓
UI result / API result / Webhook event
        ↓
Optional manual swap via Jupiter
```

This structure makes Niffera usable both as a product and as an infrastructure component.

---

## Configuration Surface

Niffera exposes a practical configuration surface for builders. You are not tuning abstract ML internals; you are controlling clear runtime behavior.

### Common things you can tune

| Surface | Examples |
|---|---|
| Request params | `chain`, `timeframe`, `token_address`, `wallet_address`, `agent_id` |
| Metadata | `client_id`, `idempotency_key`, request labels |
| Webhooks | destination URL, event selection, signing secret |
| Runtime policy | polling interval, retries, backoff strategy |
| Environment | API key, webhook secret, deployment URLs |
| Product behavior | credit usage awareness, tier-based throughput, alert routing |

### Example environment setup

```bash
NIFFERA_API_KEY=your_api_key_here
NIFFERA_WEBHOOK_SECRET=your_webhook_secret_here
NIFFERA_BASE_URL=https://api.niffera.com/v1
```

### Example request surface

```json
{
  "agent_id": "wallet_analytics_v1",
  "input": {
    "wallet_address": "YourWalletAddressHere",
    "chain": "solana",
    "timeframe": "30d"
  },
  "metadata": {
    "client_id": "ops-dashboard",
    "idempotency_key": "wallet-review-042"
  },
  "webhook_url": "https://your-app.com/niffera-webhook"
}
```

> [!TIP]
> If you expect retries, always send an `idempotency_key` so duplicate logical requests do not create duplicate jobs.

---

## Production Notes

Niffera is designed to be practical in production environments where clarity and control matter more than flashy abstractions.

### Stack and operating model

| Area | Notes |
|---|---|
| API style | HTTPS + JSON with Bearer authentication |
| Execution model | Async jobs for heavier runs, polling or webhooks for completion |
| Current live chain | Solana |
| Swap routing | Jupiter |
| Account model | Wallet-based identity |
| Economic model | Credits + paid tiers + $NIFFERA utility token |
| Token usage split | 80% burn / 20% treasury |

### Performance and deployment hints

The jobs model is there to avoid request timeout problems for heavy analytics. Small checks can feel near-real-time, while larger runs should be treated as async work from the start.

For production use, a stable pattern looks like this:

1. Your service sends `POST /agents/run`
2. Niffera returns `job_id`
3. You either poll `GET /jobs/{job_id}` or wait for `job.completed`
4. Your app stores the result and decides whether to notify, display, or escalate it

### Recommended practices

- Keep API keys in secrets storage
- Verify webhook signatures with HMAC SHA-256
- Acknowledge webhook deliveries quickly and process them async
- Use retries with backoff instead of tight polling loops
- Treat Niffera as an analytics and decisioning layer, not as blind execution logic

> [!NOTE]
> The cleanest production architecture is usually Niffera for analytics and signals, with final execution logic and risk policy enforced inside your own stack.

---

## Known Constraints

Niffera is intentionally opinionated, and some constraints are part of that design rather than missing features.

| Constraint | What it means in practice |
|---|---|
| No autonomous trading in the current product | Trades are manual and require wallet signature |
| Solana-first execution | Jupiter swaps are live on Solana, while wider chain coverage is roadmap-based |
| Data may have delays or gaps | On-chain and market feeds can be imperfect, especially during volatility |
| Analytics are not guarantees | Results are informational, not financial advice or certainty |
| Free tier is limited | 10 starter credits are enough to test, not to run sustained production usage |
| Heavy usage depends on paid tiers | Throughput, limits, and deeper usage scale with credits and subscription tier |
| Browser extension and Telegram Mini App are not live yet | They are planned companion surfaces, not fully deployed execution layers |
| Niffera is non-custodial | The platform never holds assets, which means the user must still manage wallet safety and approvals carefully |

### Non-supported expectations

Niffera is not meant for:
- guaranteed signal products
- blind copy trading
- one-click profit automation
- custody or delegated trade execution
- ignoring wallet confirmation flows

That boundary is important because the system is built to improve judgment, not replace responsibility.

---

## Closing View

Niffera Analytics is strongest when used as a **risk-aware intelligence layer** inside a real trading workflow.

For traders, that means seeing token structure, wallet behavior, AI commentary, and execution context in one place.  
For builders, that means a fast integration surface with clean primitives: JSON in, structured analytics out, optional webhooks, and a clear path from fit to extension.

If your question is **“how fast can I plug this into a real system?”**, the answer is simple: start with one agent run, treat jobs as the contract, and build from there.
