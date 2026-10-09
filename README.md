# PolyEdge TypeScript / Node.js SDK

[![npm version](https://img.shields.io/npm/v/polyedge.svg?color=blue&cache=1)](https://www.npmjs.com/package/polyedge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-polyedge.dev-cyan)](https://polyedge.dev/docs)
[![Benchmark](https://img.shields.io/badge/benchmark-100%2B_nodes-green)](https://github.com/PolyEdgeDev/polyedge-stream-benchmark)

Official TypeScript/Node.js SDK for **[PolyEdge](https://polyedge.dev)** — **Ultra-Low-Latency Polymarket Mempool Trade Streaming & Real-Time On-Chain Analytics API.**

> Engineered for Polymarket copy-trading bots, professional traders, and prediction market builders. Capture pending trades pre-block and track smart money with institutional-grade on-chain analytics.

---

## Key Features

- **4 First-Class Namespaces**: Aligned 1:1 with OpenAPI 3.1:
  - `client.streams`: Real-time SSE trade streaming, sessions & filter management.
  - `client.analytics`: Polymarket CTFExchange trade attribution, trader leaderboards, market settlement audit.
  - `client.account`: Account profile, API key rotation, request telemetry, and ledger.
  - `client.subscription`: Plan catalog, subscription quotes, and promo codes.
- **Enterprise-Grade SSE Streaming Engine**:
  - **45s Keep-Alive Watchdog**: Terminates silent TCP half-open connections and auto-heals.
  - **Auto-Resumption with `Last-Event-ID`**: Atomically tracks event IDs and replays buffered trades on reconnection.
  - **Jittered Exponential Backoff**: Prevents thundering herds during network hiccups.
  - **Dual Consumption**: Event listeners (`stream.on('tx', ...)`) and Async Iterators (`for await (const tx of stream)`).
- **Pre-Block Polymarket Trade Streaming**: Peered with 100+ Polygon nodes to capture pending Polymarket trades pre-block. The World's Fastest — [verify yourself](https://github.com/PolyEdgeDev/polyedge-stream-benchmark).

---

## Installation

```bash
npm install polyedge
# or
pnpm add polyedge
# or
yarn add polyedge
```

---

## Quick Start

### 1. Initialize Client

```typescript
import { PolyEdgeClient } from "polyedge";

const client = new PolyEdgeClient({
  apiKey: process.env.POLYEDGE_API_KEY!,
});
```

### 2. Real-Time Mempool Trade Stream (SSE)

```typescript
// Connect to an active stream
const stream = client.streams.connect("your_stream_id", {
  heartbeatTimeoutMs: 45_000, // 45s watchdog timer (server heartbeats every 30s)
});

// Event Listener Pattern
stream.on("tx", (tx, eventId) => {
  console.log(`⚡ [Trade #${eventId}] Tx: ${tx.tx_hash.slice(0, 18)}...`);
  console.log(`   Market: "${tx.market?.question}"`);
  console.log(`   Taker: ${tx.taker?.outcome} (${tx.taker?.side}) | Shares: ${tx.taker?.shares}`);
  console.log(`   Matched Makers: ${tx.makers?.length || 0} orders`);
});

stream.on("heartbeat", () => {
  console.log("💓 Server heartbeat received");
});

stream.on("reconnect", (attempt, delayMs) => {
  console.warn(`Reconnecting in ${delayMs}ms (attempt #${attempt})...`);
});

stream.on("error", (err) => {
  console.error("Stream error:", err.message);
});

// Or Async Iterator Pattern:
// for await (const tx of stream) {
//   console.log("Trade:", tx.tx_hash, tx.market?.question);
// }
```

### 3. Analytics: Leaderboard & Trader Dossier

```typescript
// Query top profitable traders
const leaderboard = await client.analytics.getLeaderboard({ limit: 5 });
console.log(`Total active traders tracked: ${leaderboard.total_count}`);

leaderboard.traders?.forEach((t, i) => {
  const pnlUsd = ((t.total_pnl || 0) / 1e6).toFixed(2);
  console.log(`#${i + 1} ${t.profile?.address} (${t.profile?.name || "Anon"}) - Realized PnL: $${pnlUsd}`);
});

// Inspect deep trader profile
const dossier = await client.analytics.getTrader("0x51698a47f840a242abc2ca0351371c7ffac41842");
console.log(`Trader ${dossier.profile?.name} - Taker Tier: ${dossier.taker_tier_name}`);
```

### 4. Account Profile & Telemetry

```typescript
// Account info
const profile = await client.account.getProfile();
console.log(`Email: ${profile.email}, Tier: ${profile.tier}, Status: ${profile.status}`);

// Usage telemetry
const telemetry = await client.account.getTelemetry();
console.log(`Today's requests: ${telemetry.total_requests}`);
```

---

## Complete API Service Reference (28 Methods)

### 1. Streams Service (`client.streams`)

| Method | HTTP | Description |
| :--- | :--- | :--- |
| `connect(streamId, options)` | `GET /streams/{id}` (SSE) | Connect to ultra-low-latency real-time SSE mempool trade stream |
| `list()` | `GET /streams` | List all configured data streams |
| `create(req)` | `POST /streams` | Provision a new targeted filter stream (tags, addresses, series) |
| `get(id)` | `GET /streams/{id}` | Get stream metadata and configuration by ID |
| `updateMetadata(id, req)` | `PUT /streams/{id}/meta` | Update stream name and description |
| `updateSubscription(id, req)` | `PUT /streams/{id}/subscription` | Hot-reload market filters (addresses, tags, series) on active stream |
| `delete(id)` | `DELETE /streams/{id}` | Delete stream by ID |
| `getActiveSessions()` | `GET /sessions` | List all active live SSE connections across streams |
| `getSessionHistory(params)` | `GET /sessions/history` | Query historical SSE connection logs and durations |

### 2. Analytics Service (`client.analytics`)

| Method | HTTP | Description |
| :--- | :--- | :--- |
| `getLeaderboard(params)` | `GET /v2/analytics/leaderboard` | Top profitable traders ranked by realized PnL, volume, and ROI |
| `getTrader(address)` | `GET /v2/traders/{address}` | Comprehensive trader intelligence profile, taker tier, and top tags |
| `getTraderHourlyStats(address)` | `GET /v2/traders/{address}/hourly_stats` | 24-hour hourly trading PnL and volume breakdown |
| `getTraderMarkets(address, params)` | `GET /v2/traders/{address}/markets` | Historical market positions and settled outcomes by trader |
| `getTraderMarketOrders(addr, marketId, params)` | `GET /v2/traders/{address}/markets/{id}/orders` | Order fill details for a specific trader in a specific market |
| `getMarket(id)` | `GET /v2/markets/{id}` | Prediction market detail, top 20 earners, and volume attribution |
| `getDeposits(params)` | `GET /v2/analytics/deposits` | 60-day aggregated trader deposit summaries (>= 100 pUSD) |

### 3. Account Service (`client.account`)

| Method | HTTP | Description |
| :--- | :--- | :--- |
| `getProfile()` | `GET /v2/user/me` | Current user profile, active tier, and deposit balance |
| `listKeys()` | `GET /v2/user/keys` | List all active API keys and statuses |
| `createKey(req)` | `POST /v2/user/keys` | Generate a new API key with custom name |
| `updateKey(key, req)` | `PATCH /v2/user/keys/{key}` | Enable, disable, or rename an API key |
| `deleteKey(key)` | `DELETE /v2/user/keys/{key}` | Revoke and delete an API key |
| `getLedger(params)` | `GET /v2/user/ledger` | Balance ledger transaction records |
| `getTelemetry()` | `GET /v2/user/telemetry` | Daily request count and per-endpoint usage telemetry |
| `withdraw(req)` | `POST /v2/user/withdraw` | Request balance withdrawal |

### 4. Subscription Service (`client.subscription`)

| Method | HTTP | Description |
| :--- | :--- | :--- |
| `listTiers()` | `GET /v2/tiers` | Public tier catalog, feature allowances, and pricing specifications |
| `getQuote(req)` | `POST /v2/user/subscribe/quote` | Calculate quote for plan upgrade or billing cycle change |
| `subscribe(req)` | `POST /v2/user/subscribe` | Purchase or upgrade tier subscription |
| `validatePromoCode(req)` | `POST /v2/user/promo-codes/validate` | Validate promotional discount code |

---

## License

[MIT](LICENSE) © 2026 [PolyEdge Labs](https://polyedge.dev)
