import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { PolyEdgeStream } from "../src/stream.ts";
import { PolyEdgeClient } from "../src/client.ts";

function createMockSSEServer(port: number) {
  let requestCount = 0;
  const receivedHeaders: http.IncomingHttpHeaders[] = [];
  const server = http.createServer((req, res) => {
    requestCount++;
    receivedHeaders.push(req.headers);

    if (req.url?.includes("/fatal-error")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    if (req.url?.includes("/streams/test-stream-1")) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      // Send initial heartbeat
      res.write(": heartbeat\n\n");

      // Send a trade event
      const sampleTx = {
        tx_hash: "0xabc123",
        timestamp: "2026-10-09T00:00:00Z",
        market: {
          id: 101,
          question: "Will ETH hit $5000?",
          slug: "eth-5k",
          event_slug: "eth-5k",
          series_slug: "eth",
          condition_id: "0xcond",
          neg_risk: false,
          sports_market_type: "",
          start_date: "2026-01-01T00:00:00Z",
          tags_slug: ["crypto"],
          outcomes: ["Yes", "No"],
          token_ids: ["token1", "token2"],
        },
        taker: {
          fee: "100",
          order: {
            order_hash: "0xoh",
            shares: "10",
            signature_type: 1,
            timestamp: "2026-10-09T00:00:00Z",
            usdc: "5",
          },
          outcome: "Yes",
          shares: "10",
          side: "BUY",
          token_ids_index: 0,
          usdc: "5",
          user: { address: "0xuser", name: "Alpha" },
        },
        makers: [],
      };

      res.write(`id: 9999\nevent: tx\ndata: ${JSON.stringify(sampleTx)}\n\n`);

      // Keep open or close after some delay
      setTimeout(() => {
        res.end();
      }, 50);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return new Promise<{ server: http.Server; url: string; getHeaders: () => http.IncomingHttpHeaders[]; getCount: () => number }>((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({
        server,
        url: `http://127.0.0.1:${port}`,
        getHeaders: () => receivedHeaders,
        getCount: () => requestCount,
      });
    });
  });
}

test("TypeScript SDK: SSE stream receives heartbeat, parses events, and tracks lastEventId", async () => {
  const mock = await createMockSSEServer(18610);
  try {
    const stream = new PolyEdgeStream("test-stream-1", {
      apiKey: "test_key_123",
      streamBaseUrl: mock.url,
      heartbeatTimeoutMs: 5000,
      initialBackoffMs: 100,
    });

    let receivedTx: any = null;
    let receivedHeartbeat = false;

    stream.on("heartbeat", () => {
      receivedHeartbeat = true;
    });

    stream.on("tx", (tx, id) => {
      receivedTx = tx;
      assert.equal(id, "9999");
    });

    stream.connect();

    // Wait until tx is received
    for (let i = 0; i < 20; i++) {
      if (receivedTx && receivedHeartbeat) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    assert.ok(receivedHeartbeat, "Heartbeat event should be emitted");
    assert.ok(receivedTx, "Transaction event should be received");
    assert.equal(receivedTx.tx_hash, "0xabc123");
    assert.equal(stream.getLastEventId(), "9999", "Last event ID should be 9999");

    stream.destroy();
  } finally {
    mock.server.close();
  }
});

test("TypeScript SDK: Fatal HTTP 401 fails fast without retrying", async () => {
  const mock = await createMockSSEServer(18611);
  try {
    const stream = new PolyEdgeStream("fatal-error", {
      apiKey: "bad_key",
      streamBaseUrl: mock.url,
      heartbeatTimeoutMs: 5000,
      initialBackoffMs: 50,
    });

    let errorEmitted = false;
    stream.on("error", (err) => {
      errorEmitted = true;
      assert.ok(err.message.includes("401"));
    });

    stream.connect();
    await new Promise((r) => setTimeout(r, 150));

    assert.ok(errorEmitted, "Error should be emitted for 401");
    assert.equal(mock.getCount(), 1, "Should not retry on 401 fatal error");

    stream.destroy();
  } finally {
    mock.server.close();
  }
});

test("TypeScript SDK: Watchdog triggers reconnect and supplies Last-Event-ID header", async () => {
  let connCount = 0;
  const receivedLastEventIds: (string | undefined)[] = [];

  const server = http.createServer((req, res) => {
    connCount++;
    receivedLastEventIds.push(req.headers["last-event-id"] as string | undefined);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    if (connCount === 1) {
      // First connection: send one message with id 42, then keep silent so watchdog fires
      res.write("id: 42\nevent: tx\ndata: {}\n\n");
      // Do not send heartbeat or anything else
    } else {
      // Second connection: send heartbeat and end
      res.write(": heartbeat\n\n");
      setTimeout(() => res.end(), 20);
    }
  });

  await new Promise<void>((resolve) => server.listen(18612, "127.0.0.1", () => resolve()));

  try {
    const stream = new PolyEdgeStream("resume-test", {
      apiKey: "test_key",
      streamBaseUrl: "http://127.0.0.1:18612",
      heartbeatTimeoutMs: 150, // Short watchdog timeout for testing
      initialBackoffMs: 50,
    });

    // Handle error events so watchdog timeout does not cause unhandled EventEmitter error
    stream.on("error", () => {});

    let reconnected = false;
    stream.on("reconnect", () => {
      reconnected = true;
    });

    stream.connect();

    // Wait for watchdog timeout and reconnect
    for (let i = 0; i < 20; i++) {
      if (connCount >= 2) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    assert.ok(connCount >= 2, "Watchdog should have triggered reconnect");
    assert.equal(receivedLastEventIds[0], undefined, "First connection has no Last-Event-ID");
    assert.equal(receivedLastEventIds[1], "42", "Second connection must contain Last-Event-ID: 42");

    stream.destroy();
  } finally {
    server.close();
  }
});

