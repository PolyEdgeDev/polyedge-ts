import { PolyEdgeStream, type StreamOptions } from "./stream";
import type * as Models from "./types";

export interface PolyEdgeClientOptions {
  /** API Key token for authentication */
  apiKey: string;
  /** Base URL for REST analytics & account gateway (default: https://api.polyedge.dev) */
  apiBaseUrl?: string;
  /** Base URL for SSE real-time streaming gateway (default: https://stream.polyedge.dev) */
  streamBaseUrl?: string;
}

/** Base requester helper shared by services */
export type Requester = <T>(baseUrl: string, endpoint: string, options?: RequestInit) => Promise<T>;

/** Streams Service: APIs for streams operations */
export class StreamsService {
  private readonly request: Requester;
  private readonly apiBaseUrl: string;
  private readonly streamBaseUrl: string;
  private readonly apiKey: string;

  constructor(request: Requester, apiBaseUrl: string, streamBaseUrl: string, apiKey: string) {
    this.request = request;
    this.apiBaseUrl = apiBaseUrl;
    this.streamBaseUrl = streamBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Connect to real-time Server-Sent Events (SSE) order execution stream
   * @param streamId Target stream ID
   */
  public connect(streamId: string, options: Partial<StreamOptions> = {}): PolyEdgeStream {
    const s = new PolyEdgeStream(streamId, {
      apiKey: this.apiKey,
      streamBaseUrl: this.streamBaseUrl,
      ...options,
    });
    queueMicrotask(() => s.connect());
    return s;
  }

  /**
   * List User Streams
   * Returns custom and managed real-time trade streams configured by the user.
   * @returns Models.UserStreamsResponse
   */
  public async list(): Promise<Models.UserStreamsResponse> {
    return this.request<Models.UserStreamsResponse>(this.streamBaseUrl, `/streams`, { method: 'GET' });
  }

  /**
   * Create Filtered Order Stream
   * Provisions a new custom real-time stream with optional address, tag, or series filters.
   * @param req Request payload
   * @returns Models.UserStreamResponse
   */
  public async create(req: Models.UserCreateStreamRequest): Promise<Models.UserStreamResponse> {
    return this.request<Models.UserStreamResponse>(this.streamBaseUrl, `/streams`, { method: 'POST', body: JSON.stringify(req) });
  }

  /**
   * Get Stream Metadata
   * Fetches metadata, active sessions count, and filter configuration for a specific stream.
   * @param id Stream unique ID
   * @returns Models.UserStreamResponse
   */
  public async get(id: string): Promise<Models.UserStreamResponse> {
    return this.request<Models.UserStreamResponse>(this.streamBaseUrl, `/streams/${id}/meta`, { method: 'GET' });
  }

  /**
   * Delete Stream
   * Permanently removes a stream and gracefully disconnects all connected listener sessions.
   * @param id Stream unique ID
   * @returns Models.DeleteStreamResponse
   */
  public async delete(id: string): Promise<Models.DeleteStreamResponse> {
    return this.request<Models.DeleteStreamResponse>(this.streamBaseUrl, `/streams/${id}`, { method: 'DELETE' });
  }

  /**
   * Update Stream Metadata
   * Updates operational attributes of the stream, such as nickname or enabled/disabled status.
   * @param id Stream unique ID
   * @param req Request payload
   * @returns Models.UserStreamResponse
   */
  public async updateMetadata(id: string, req: Models.UserUpdateStreamMetadataRequest): Promise<Models.UserStreamResponse> {
    return this.request<Models.UserStreamResponse>(this.streamBaseUrl, `/streams/${id}/meta`, { method: 'PUT', body: JSON.stringify(req) });
  }

  /**
   * Update Stream Filter Subscription
   * Dynamically mutates monitored wallet addresses, market tags, or series slugs without disconnecting SSE clients.
   * @param id Stream unique ID
   * @param req Request payload
   * @returns Models.UserStreamResponse
   */
  public async updateSubscription(id: string, req: Models.UpdateSubscriptionRequest): Promise<Models.UserStreamResponse> {
    return this.request<Models.UserStreamResponse>(this.streamBaseUrl, `/streams/${id}/subscription`, { method: 'PUT', body: JSON.stringify(req) });
  }

  /**
   * List All User Active Sessions
   * Returns all currently connected active SSE listeners for this account.
   * @returns Models.UserActiveSessionsResponse
   */
  public async getActiveSessions(): Promise<Models.UserActiveSessionsResponse> {
    return this.request<Models.UserActiveSessionsResponse>(this.streamBaseUrl, `/sessions`, { method: 'GET' });
  }

  /**
   * List User Stream Session History
   * Returns historical SSE connection logs including duration and pushed transactions count.
   * @param params.limit Max records to return
   * @param params.offset Pagination offset
   * @returns Models.UserSessionHistoryResponse
   */
  public async getSessionHistory(params: { limit?: number; offset?: number } = {}): Promise<Models.UserSessionHistoryResponse> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Models.UserSessionHistoryResponse>(this.streamBaseUrl, `/sessions/history${qs}`, { method: 'GET' });
  }

}

/** Analytics Service: APIs for analytics operations */
export class AnalyticsService {
  private readonly request: Requester;
  private readonly apiBaseUrl: string;
  private readonly streamBaseUrl: string;
  private readonly apiKey: string;

  constructor(request: Requester, apiBaseUrl: string, streamBaseUrl: string, apiKey: string) {
    this.request = request;
    this.apiBaseUrl = apiBaseUrl;
    this.streamBaseUrl = streamBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * 60-Day Trader Deposit Analytics
   * Returns 60-day aggregated deposit summary and individual transaction breakdown for top traders.
   * @param params.limit Max records to return
   * @param params.offset Pagination offset
   * @returns Models.DepositQueryResult
   */
  public async getDeposits(params: { limit?: number; offset?: number } = {}): Promise<Models.DepositQueryResult> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Models.DepositQueryResult>(this.apiBaseUrl, `/v2/analytics/deposits${qs}`, { method: 'GET' });
  }

  /**
   * Top Traders PnL Leaderboard
   * Queries ranked traders across timeframes with PnL, volume, win rate, and performance metrics.
   * @param params.limit Max traders to return
   * @param params.offset Pagination offset
   * @returns Models.LeaderboardResponse
   */
  public async getLeaderboard(params: { limit?: number; offset?: number } = {}): Promise<Models.LeaderboardResponse> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Models.LeaderboardResponse>(this.apiBaseUrl, `/v2/analytics/leaderboard${qs}`, { method: 'GET' });
  }

  /**
   * Get Prediction Market Detail
   * Fetches standardized market metadata matching on-chain condition IDs and NegRisk parameters.
   * @param id Market numeric ID or condition ID
   * @returns Models.MarketDetailResponse
   */
  public async getMarket(id: string): Promise<Models.MarketDetailResponse> {
    return this.request<Models.MarketDetailResponse>(this.apiBaseUrl, `/v2/markets/${id}`, { method: 'GET' });
  }

  /**
   * Get Trader Intelligence Profile
   * Fetches trader identity dossier, pUSD balance, total PnL, win rates, and ranking metrics.
   * @param address Trader Polygon/Ethereum wallet address
   * @returns Models.TraderProfileResponse
   */
  public async getTrader(address: string): Promise<Models.TraderProfileResponse> {
    return this.request<Models.TraderProfileResponse>(this.apiBaseUrl, `/v2/traders/${address}`, { method: 'GET' });
  }

  /**
   * Get Hourly PnL Equity Curve
   * Provides 1-hour bucketed historical equity curves and trade metrics for a specific trader.
   * @param address Trader Polygon/Ethereum wallet address
   * @returns Models.TraderHourlyStatsResponse
   */
  public async getTraderHourlyStats(address: string): Promise<Models.TraderHourlyStatsResponse> {
    return this.request<Models.TraderHourlyStatsResponse>(this.apiBaseUrl, `/v2/traders/${address}/hourly_stats`, { method: 'GET' });
  }

  /**
   * Get Trader Market Participation History
   * Queries resolved and active prediction markets traded by the specified wallet address.
   * @param address Trader Polygon/Ethereum wallet address
   * @param params.limit Max markets to return
   * @param params.offset Pagination offset
   * @returns Models.TraderHistoryResponse
   */
  public async getTraderMarkets(address: string, params: { limit?: number; offset?: number } = {}): Promise<Models.TraderHistoryResponse> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Models.TraderHistoryResponse>(this.apiBaseUrl, `/v2/traders/${address}/markets${qs}`, { method: 'GET' });
  }

  /**
   * Get Trader Orders in Market
   * Retrieves granular fill events, side, price, and token outcomes for a trader in a given market.
   * @param address Trader wallet address
   * @param id Market numeric ID
   * @param params.limit Max orders to return
   * @param params.offset Pagination offset
   * @returns Models.UserOrdersResponse
   */
  public async getTraderMarketOrders(address: string, id: string, params: { limit?: number; offset?: number } = {}): Promise<Models.UserOrdersResponse> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Models.UserOrdersResponse>(this.apiBaseUrl, `/v2/traders/${address}/markets/${id}/orders${qs}`, { method: 'GET' });
  }

}

/** Account Service: APIs for account operations */
export class AccountService {
  private readonly request: Requester;
  private readonly apiBaseUrl: string;
  private readonly streamBaseUrl: string;
  private readonly apiKey: string;

  constructor(request: Requester, apiBaseUrl: string, streamBaseUrl: string, apiKey: string) {
    this.request = request;
    this.apiBaseUrl = apiBaseUrl;
    this.streamBaseUrl = streamBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get Current Profile
   * Retrieves the authenticated user profile, tier subscription status, and available USDC balance.
   * @returns Models.UserProfile
   */
  public async getProfile(): Promise<Models.UserProfile> {
    return this.request<Models.UserProfile>(this.apiBaseUrl, `/v2/user/me`, { method: 'GET' });
  }

  /**
   * List API Keys
   * Lists all active and revoked API keys issued to the authenticated account.
   * @returns Models.UserKeysResponse
   */
  public async listKeys(): Promise<Models.UserKeysResponse> {
    return this.request<Models.UserKeysResponse>(this.apiBaseUrl, `/v2/user/keys`, { method: 'GET' });
  }

  /**
   * Create API Key
   * Generates a new authenticated API key token with optional memo label.
   * @param req Request payload
   * @returns Models.UserAPIKey
   */
  public async createKey(req: Models.CreateAPIKeyRequest): Promise<Models.UserAPIKey> {
    return this.request<Models.UserAPIKey>(this.apiBaseUrl, `/v2/user/keys`, { method: 'POST', body: JSON.stringify(req) });
  }

  /**
   * Update API Key
   * Modifies label memo or operational status of an existing API key.
   * @param key API key string
   * @param req Request payload
   * @returns Models.UserAPIKey
   */
  public async updateKey(key: string, req: Models.UserUpdateKeyRequest): Promise<Models.UserAPIKey> {
    return this.request<Models.UserAPIKey>(this.apiBaseUrl, `/v2/user/keys/${key}`, { method: 'PATCH', body: JSON.stringify(req) });
  }

  /**
   * Revoke API Key
   * Permanently revokes and deactivates an API key token.
   * @param key API key string
   * @returns Models.DeleteKeyResponse
   */
  public async deleteKey(key: string): Promise<Models.DeleteKeyResponse> {
    return this.request<Models.DeleteKeyResponse>(this.apiBaseUrl, `/v2/user/keys/${key}`, { method: 'DELETE' });
  }

  /**
   * List User Balance Ledger
   * Lists chronological ledger entries (subscription billing charges, deposits, withdrawals).
   * @param params.limit Max entries to return
   * @param params.offset Pagination offset
   * @returns Models.UserLedgerResponse
   */
  public async getLedger(params: { limit?: number; offset?: number } = {}): Promise<Models.UserLedgerResponse> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Models.UserLedgerResponse>(this.apiBaseUrl, `/v2/user/ledger${qs}`, { method: 'GET' });
  }

  /**
   * Get Account Telemetry & Limits
   * Provides live usage statistics, quota limits, and remaining streaming bandwidth.
   * @returns Models.UserTelemetryResponse
   */
  public async getTelemetry(): Promise<Models.UserTelemetryResponse> {
    return this.request<Models.UserTelemetryResponse>(this.apiBaseUrl, `/v2/user/telemetry`, { method: 'GET' });
  }

  /**
   * Request Balance Withdrawal
   * Submits a request to withdraw unspent USDC balance to a designated Polygon address.
   * @param req Request payload
   * @returns Models.UserWithdrawResponse
   */
  public async withdraw(req: Models.UserWithdrawRequest): Promise<Models.UserWithdrawResponse> {
    return this.request<Models.UserWithdrawResponse>(this.apiBaseUrl, `/v2/user/withdraw`, { method: 'POST', body: JSON.stringify(req) });
  }

}

/** Subscription Service: APIs for subscription operations */
export class SubscriptionService {
  private readonly request: Requester;
  private readonly apiBaseUrl: string;
  private readonly streamBaseUrl: string;
  private readonly apiKey: string;

  constructor(request: Requester, apiBaseUrl: string, streamBaseUrl: string, apiKey: string) {
    this.request = request;
    this.apiBaseUrl = apiBaseUrl;
    this.streamBaseUrl = streamBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * List Public Tiers Catalog
   * Returns plan tiers (Free, Starter, Pro, Growth, Whale) with limits and pricing details.
   * @returns Models.Tier[]
   */
  public async listTiers(): Promise<Models.Tier[]> {
    return this.request<Models.Tier[]>(this.apiBaseUrl, `/v2/tiers`, { method: 'GET' });
  }

  /**
   * Get Subscription Quote
   * Calculates prorated billing amounts for subscribing to or upgrading a tier plan.
   * @param req Request payload
   * @returns Models.QuoteSubscriptionResponse
   */
  public async getQuote(req: Models.QuoteSubscriptionRequest): Promise<Models.QuoteSubscriptionResponse> {
    return this.request<Models.QuoteSubscriptionResponse>(this.apiBaseUrl, `/v2/user/subscribe/quote`, { method: 'POST', body: JSON.stringify(req) });
  }

  /**
   * Purchase / Upgrade Tier Subscription
   * Executes purchase, renewal, or upgrade of an active subscription tier plan.
   * @param req Request payload
   * @returns Models.SubscribeResponse
   */
  public async subscribe(req: Models.SubscribeRequest): Promise<Models.SubscribeResponse> {
    return this.request<Models.SubscribeResponse>(this.apiBaseUrl, `/v2/user/subscribe`, { method: 'POST', body: JSON.stringify(req) });
  }

  /**
   * Validate Promo Code
   * Verifies validity, discount percentage, and applicable plans for a promotion coupon code.
   * @param req Request payload
   * @returns Models.ValidatePromoCodeResponse
   */
  public async validatePromoCode(req: Models.ValidatePromoCodeRequest): Promise<Models.ValidatePromoCodeResponse> {
    return this.request<Models.ValidatePromoCodeResponse>(this.apiBaseUrl, `/v2/user/promo-codes/validate`, { method: 'POST', body: JSON.stringify(req) });
  }

}

/**
 * PolyEdge API Client
 * Provides namespaced access to Streams, Analytics, Account, and Subscription services.
 */
export class PolyEdgeClient {
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;
  private readonly streamBaseUrl: string;

  /** Streams Service: Real-time SSE trade streaming & filters */
  public readonly streams: StreamsService;
  /** Analytics Service: Leaderboard, trader intelligence, markets */
  public readonly analytics: AnalyticsService;
  /** Account Service: Profile, keys, ledger, telemetry */
  public readonly account: AccountService;
  /** Subscription Service: Plan tiers, quotes, checkout */
  public readonly subscription: SubscriptionService;

  constructor(options: PolyEdgeClientOptions) {
    if (!options.apiKey) throw new Error("PolyEdgeClient: apiKey is required");
    this.apiKey = options.apiKey;
    this.apiBaseUrl = (options.apiBaseUrl || "https://api.polyedge.dev").replace(/\/+$/, "");
    this.streamBaseUrl = (options.streamBaseUrl || "https://stream.polyedge.dev").replace(/\/+$/, "");

    const req = this.request.bind(this);
    this.streams = new StreamsService(req, this.apiBaseUrl, this.streamBaseUrl, this.apiKey);
    this.analytics = new AnalyticsService(req, this.apiBaseUrl, this.streamBaseUrl, this.apiKey);
    this.account = new AccountService(req, this.apiBaseUrl, this.streamBaseUrl, this.apiKey);
    this.subscription = new SubscriptionService(req, this.apiBaseUrl, this.streamBaseUrl, this.apiKey);
  }

  private async request<T>(baseUrl: string, endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-PolyEdge-Key": this.apiKey,
      ...(options.headers as Record<string, string>),
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`PolyEdge API Error [${res.status}]: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  /** Direct helper to create SSE order stream */
  public stream(streamId: string, options: Partial<StreamOptions> = {}): PolyEdgeStream {
    return this.streams.connect(streamId, options);
  }
}