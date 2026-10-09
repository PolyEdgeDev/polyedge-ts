import { EventEmitter } from "node:events";
import type { LiveTransaction } from "./types";

export interface StreamOptions {
  apiKey: string;
  streamBaseUrl?: string;
  heartbeatTimeoutMs?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

export interface StreamEvents {
  tx: (tx: LiveTransaction, eventId: string) => void;
  heartbeat: () => void;
  error: (err: Error) => void;
  reconnect: (attempt: number, delayMs: number) => void;
  close: (reason: string) => void;
}

export class PolyEdgeStream extends EventEmitter {
  private readonly streamId: string;
  private readonly apiKey: string;
  private readonly streamBaseUrl: string;
  private readonly heartbeatTimeoutMs: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;

  private lastEventId: string | null = null;
  private abortController: AbortController | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isDestroyed = false;
  private isConnecting = false;

  // Queue for async iterator support
  private asyncQueue: Array<{ tx?: LiveTransaction; err?: Error; done?: boolean }> = [];
  private asyncResolvers: Array<() => void> = [];

  constructor(streamId: string, options: StreamOptions) {
    super();
    if (!streamId || typeof streamId !== "string") {
      throw new Error("PolyEdgeStream: streamId must be a non-empty string");
    }
    if (!options.apiKey || typeof options.apiKey !== "string") {
      throw new Error("PolyEdgeStream: apiKey must be a non-empty string");
    }

    this.streamId = streamId;
    this.apiKey = options.apiKey;
    this.streamBaseUrl = (options.streamBaseUrl || "https://stream.polyedge.dev").replace(/\/+$/, "");
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 45_000;
    this.initialBackoffMs = options.initialBackoffMs ?? 1_000;
    this.maxBackoffMs = options.maxBackoffMs ?? 30_000;
  }

  public getLastEventId(): string | null {
    return this.lastEventId;
  }

  public connect(): void {
    if (this.isDestroyed || this.isConnecting) return;
    this.isConnecting = true;
    this.clearTimers();

    this.abortController = new AbortController();
    const currentSignal = this.abortController.signal;

    const streamUrl = new URL(`${this.streamBaseUrl}/streams/${this.streamId}`);
    if (this.lastEventId) {
      streamUrl.searchParams.set("lastEventId", this.lastEventId);
    }

    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      "X-PolyEdge-Key": this.apiKey,
      "Cache-Control": "no-cache",
    };
    if (this.lastEventId) {
      headers["Last-Event-ID"] = this.lastEventId;
    }

    this.startWatchdog();

    (async () => {
      try {
        const response = await fetch(streamUrl.toString(), {
          method: "GET",
          headers,
          signal: currentSignal,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          const errMsg = `Stream connection failed with HTTP ${response.status}: ${errText}`;
          const err = new Error(errMsg);

          // Fatal HTTP status codes: fail-fast immediately without retrying
          if ([400, 401, 403, 404].includes(response.status)) {
            this.pushAsync({ err });
            this.emit("error", err);
            this.destroy("fatal_http_status");
            return;
          }

          throw err;
        }

        if (!response.body) {
          throw new Error("Response body is null, expected text/event-stream stream");
        }

        // Connection successfully established; reset reconnect backoff counter
        this.reconnectAttempts = 0;
        this.isConnecting = false;

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (!this.isDestroyed) {
          const { done, value } = await reader.read();
          if (done) break;

          // Received any byte chunk: reset watchdog keep-alive timer
          this.resetWatchdog();

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            this.parseBlock(block);
          }
        }

        if (!this.isDestroyed) {
          this.scheduleReconnect("stream_eos");
        }
      } catch (err: unknown) {
        if (this.isDestroyed || currentSignal.aborted) return;
        this.emit("error", err instanceof Error ? err : new Error(String(err)));
        this.scheduleReconnect("network_error");
      } finally {
        this.isConnecting = false;
      }
    })();
  }

  private parseBlock(block: string): void {
    const trimmed = block.trim();
    if (!trimmed) return;

    // Check for comment/heartbeat lines starting with ':'
    if (trimmed.startsWith(":")) {
      this.emit("heartbeat");
      return;
    }

    const lines = trimmed.split("\n");
    let eventId: string | null = null;
    let eventType = "message";
    const dataLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith(":")) {
        // Comment inside block
        continue;
      } else if (line.startsWith("id:")) {
        eventId = line.slice(3).trim();
      } else if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(rawLine.slice(rawLine.indexOf("data:") + 5).trimStart());
      }
    }

    if (eventId) {
      this.lastEventId = eventId;
    }

    if (eventType === "tx" && dataLines.length > 0) {
      const payloadStr = dataLines.join("\n");
      try {
        const tx = JSON.parse(payloadStr) as LiveTransaction;
        this.pushAsync({ tx });
        this.emit("tx", tx, this.lastEventId ?? "");
      } catch (err) {
        this.emit("error", new Error(`Failed to parse LiveTransaction JSON: ${String(err)}`));
      }
    }
  }

  private startWatchdog(): void {
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      this.emit("error", new Error(`SSE Watchdog timed out after ${this.heartbeatTimeoutMs}ms with no bytes/heartbeat received`));
      this.abortController?.abort();
      this.scheduleReconnect("watchdog_timeout");
    }, this.heartbeatTimeoutMs);
  }

  private resetWatchdog(): void {
    if (!this.isDestroyed) {
      this.startWatchdog();
    }
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearWatchdog();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(reason: string): void {
    if (this.isDestroyed) return;
    this.clearTimers();
    this.isConnecting = false;

    this.reconnectAttempts++;
    // Exponential backoff with random jitter (+/- 20%)
    const exponential = Math.min(
      this.maxBackoffMs,
      this.initialBackoffMs * Math.pow(2, this.reconnectAttempts - 1)
    );
    const jitter = exponential * (0.8 + Math.random() * 0.4);
    const delayMs = Math.round(jitter);

    this.emit("reconnect", this.reconnectAttempts, delayMs);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delayMs);
  }

  private pushAsync(item: { tx?: LiveTransaction; err?: Error; done?: boolean }): void {
    this.asyncQueue.push(item);
    const resolver = this.asyncResolvers.shift();
    if (resolver) resolver();
  }

  public async *[Symbol.asyncIterator](): AsyncGenerator<LiveTransaction, void, undefined> {
    if (!this.isConnecting && !this.abortController && !this.isDestroyed) {
      this.connect();
    }

    try {
      while (!this.isDestroyed) {
        while (this.asyncQueue.length > 0) {
          const item = this.asyncQueue.shift()!;
          if (item.err) throw item.err;
          if (item.done) return;
          if (item.tx) yield item.tx;
        }

        await new Promise<void>((resolve) => {
          this.asyncResolvers.push(resolve);
        });
      }
    } finally {
      this.destroy("async_iterator_break");
    }
  }

  public destroy(reason = "client_destroyed"): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.isConnecting = false;
    this.clearTimers();

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.pushAsync({ done: true });
    this.emit("close", reason);
    this.removeAllListeners();
  }
}
