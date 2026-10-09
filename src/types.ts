/**
 * PolyEdge API Data Models
 * Aligned with PolyEdge OpenAPI 3.1.0 specification.
 */

export type Side = "BUY" | "SELL";
export type TokenIndex = 0 | 1;

/**
 * Data model for ActiveSessionInfo
 */
export interface ActiveSessionInfo {
  /** Masked API credential used to authenticate the stream connection */
  api_key?: string;
  /** Remote IP address of the connected client */
  client_ip?: string;
  /** ISO 8601 timestamp when the SSE connection was established */
  connected_at?: string;
  /** Total active connection uptime in seconds */
  duration_seconds?: number;
  /** Total number of live matched order events delivered over this connection */
  pushed_tx_count?: number;
  /** Unique persistent stream identifier (UUID) */
  stream_id?: string;
  /** HTTP User-Agent identifier of the client library or application */
  user_agent?: string;
}

/**
 * Data model for CreateAPIKeyRequest
 */
export interface CreateAPIKeyRequest {
  key?: string;
  name?: string;
}

/**
 * Data model for DeleteKeyResponse
 */
export interface DeleteKeyResponse {
  id?: string;
}

/**
 * Data model for DeleteStreamResponse
 */
export interface DeleteStreamResponse {
  id?: string;
}

/**
 * Data model for DepositItem
 */
export interface DepositItem {
  address?: string;
  deposit_count?: number;
  /** Earliest deposit time in 60-day window (RFC3339) */
  first_deposit_at?: string;
  first_trade_at?: string;
  /** Most recent deposit time (RFC3339) */
  last_deposit_at?: string;
  last_trade_at?: string;
  /** 6 decimals micro-USD integer as string (e.g. "100000000") */
  total_deposit?: string;
}

/**
 * Data model for DepositQueryResult
 */
export interface DepositQueryResult {
  items?: DepositItem[];
  total?: number;
  updated_at?: string;
}

/**
 * Data model for ErrorResponse
 */
export interface ErrorResponse {
  error?: string;
  message?: string;
}

/**
 * Data model for HistoryMarket
 */
export interface HistoryMarket {
  /** Market thumbnail image URL */
  icon?: string;
  /** Unique numeric prediction market identifier */
  id?: number;
  /** Raw JSON array of outcome display names, e.g. ["Yes", "No"] */
  outcomes?: [string, string];
  /** Full title question describing the market condition */
  question?: string;
  /** Timestamp when market officially settled (RFC 3339 UTC), or null if active */
  resolved_at?: string;
  /** Resolution outcome (-2: unresolved, -1: void/invalid, 0-100: payout percentage for Outcome 0, e.g. 100 = Outcome 0 won, 0 = Outcome 1 won, 50 = 50/50 split) */
  result?: number;
  /** URL slug of the recurring sports league or tournament series */
  series_slug?: string;
  /** URL-friendly slug identifying the market on Polymarket */
  slug?: string;
}

/**
 * Data model for HourlyStat
 */
export interface HourlyStat {
  /** Aggregate capital cost basis in micro-USD (6 decimals) */
  cost_basis?: number;
  /** Total trading fees incurred in micro-USD (6 decimals) */
  fee?: number;
  /** 1-hour UTC bucket timestamp (ISO 8601) */
  hour?: string;
  /** Maker trading volume in micro-USD (6 decimals) */
  maker_volume?: number;
  /** Number of distinct prediction markets active or settled in this hour */
  market_count?: number;
  /** Realized net PnL in micro-USD (6 decimals) */
  pnl?: number;
  /** Taker trading volume in micro-USD (6 decimals) */
  taker_volume?: number;
  /** Number of profitable markets settled in this hour */
  win_count?: number;
}

/**
 * Data model for LeaderboardResponse
 */
export interface LeaderboardResponse {
  /** Total count of matching traders for pagination */
  total_count?: number;
  /** Ranked array of trader performance summaries */
  traders?: TraderSummary[];
}

/**
 * Data model for LiveOrder
 */
export interface LiveOrder {
  /** Execution and relayer fee paid in micro-USDC */
  fee?: string;
  /** Underlying signed off-chain CLOB limit order metadata */
  order?: OrderInfo;
  /** Market outcome label (e.g. "Yes", "No", "Up", "Down") */
  outcome?: string;
  /** Filled outcome shares amount represented as a 10^6 fixed-point decimal string */
  shares?: string;
  /** Order execution direction: "BUY" or "SELL" */
  side?: Side;
  /** 0-based index matching market.token_ids and market.outcomes */
  token_ids_index?: 0 | 1;
  /** Filled USDC notional amount in micro-USDC (10^6 scale) decimal string */
  usdc?: string;
  /** Trader account identity (wallet address and optional display pseudonym) */
  user?: MonitorTrader;
}

/**
 * Data model for LiveTransaction
 */
export interface LiveTransaction {
  /** List of matched maker limit orders filled in this transaction */
  makers?: LiveOrder[];
  /** Associated Polymarket prediction market condition and metadata */
  market?: Market;
  /** Taker order execution details that initiated the match against the CLOB */
  taker?: LiveOrder;
  /** ISO 8601 UTC timestamp (millisecond precision) indicating when the pending transaction was detected in the mempool */
  timestamp?: string;
  /** Canonical Ethereum/Polygon on-chain transaction hash confirming the match execution */
  tx_hash?: string;
}

/**
 * Data model for Market
 */
export interface Market {
  /** 32-byte hexadecimal condition ID from Gnosis Conditional Tokens */
  condition_id?: string;
  /** URL slug of the parent event containing this market */
  event_slug?: string;
  /** Sub-category item title within a grouped multi-market event */
  group_item_title?: string;
  /** Polymarket numeric prediction market identifier (e.g. 3688221) */
  id?: number;
  /** True if market operates under multi-outcome negative risk adapter */
  neg_risk?: boolean;
  /** Array of market outcome labels: [Outcome 1, Outcome 2] (e.g. ["Yes", "No"]) */
  outcomes?: [string, string];
  /** Full question describing the prediction market condition */
  question?: string;
  /** URL slug of the recurring sports league or tournament series */
  series_slug?: string;
  /** URL-friendly slug identifying the market on Polymarket */
  slug?: string;
  /** Sports market classification (e.g. moneyline, spread, over/under) */
  sports_market_type?: string;
  /** ISO 8601 UTC timestamp when trading began */
  start_date?: string;
  /** Canonical categorical tags for content filtering */
  tags_slug?: string[];
  /** ERC-1155 token IDs: [Token 1, Token 2] */
  token_ids?: [string, string];
}

/**
 * Data model for MarketDetailResponse
 */
export interface MarketDetailResponse {
  /** Complete standardized market metadata matching exporter format */
  market?: MarketMetadata;
  /** Ranked list of top 20 profitable traders in this market */
  top_earners?: MarketEarner[];
  /** Total protocol and liquidity fees collected in micro-USD (6 decimals) */
  total_fees?: number;
  /** Total positive realized PnL distributed to winners in micro-USD (6 decimals) */
  total_pnl_distributed?: number;
  /** Total count of distinct wallet addresses that traded this market */
  total_traders?: number;
  /** Cumulative trading volume across all participants in micro-USD (6 decimals) */
  total_volume?: number;
  /** Total number of distinct traders with positive realized PnL */
  total_winners?: number;
}

/**
 * Data model for MarketEarner
 */
export interface MarketEarner {
  /** Executed fill orders for this earner (included when include_orders=true) */
  orders?: UserOrder[];
  /** Realized net profit and loss in micro-USD (6 decimals, e.g. 1000000 = 1 USD) */
  pnl?: number;
  /** Public identity dossier of the earner */
  profile?: TraderIdentity;
  /** Rank position among top earners in this market (1-based) */
  rank?: number;
  /** Return on investment percentage (e.g. 25.5 for 25.5%) */
  roi?: number;
  /** Total traded volume in micro-USD (6 decimals) */
  volume?: number;
}

/**
 * Data model for MarketMetadata
 */
export interface MarketMetadata {
  /** 0x-prefixed 66-character CTF condition identifier */
  condition_id?: string;
  /** Timestamp when market was indexed in database (RFC 3339 UTC) */
  created_at?: string;
  /** Extended details and market resolution criteria */
  description?: string;
  /** Estimated resolution date or scheduled closing time (RFC 3339 UTC) */
  end_date?: string;
  /** URL slug of the parent event containing this market */
  event_slug?: string;
  /** Detailed fee schedule JSON specification */
  fee_schedule?: Record<string, any>;
  /** Fee model classification (e.g. "dynamic", "fixed") */
  fee_type?: string;
  /** Whether trading fees are activated on this market */
  fees_enabled?: boolean;
  /** Threshold for numerical interval outcomes if applicable */
  group_item_threshold?: number;
  /** Sub-category item title within a grouped multi-market event */
  group_item_title?: string;
  /** Market thumbnail image URL */
  icon?: string;
  /** Unique numeric prediction market identifier */
  id?: number;
  /** True if market operates under multi-outcome negative risk adapter */
  neg_risk?: boolean;
  /** Raw JSON array of outcome display names, e.g. ["Yes", "No"] */
  outcomes?: [string, string];
  /** Full title question describing the market condition */
  question?: string;
  /** Source URL or oracle specification for resolution */
  resolution_source?: string;
  /** Timestamp when the market officially settled (RFC 3339 UTC), or null if active */
  resolved_at?: string;
  /** Resolution outcome (-2: unresolved, -1: void/invalid, 0-100: payout percentage for Outcome 0, e.g. 100 = Outcome 0 won, 0 = Outcome 1 won, 50 = 50/50 split) */
  result?: number;
  /** URL slug of the recurring sports league or tournament series */
  series_slug?: string;
  /** URL-friendly slug identifying the market on Polymarket */
  slug?: string;
  /** Sports market classification type if applicable */
  sports_market_type?: string;
  /** Timestamp when trading began (RFC 3339 UTC) */
  start_date?: string;
  /** Raw JSON array of topic tag URL slugs */
  tags_slug?: string[];
  /** Array of 2 ERC-1155 token IDs corresponding to outcomes */
  token_ids?: [string, string];
}

/**
 * Data model for MarketSettlementDetail
 */
export interface MarketSettlementDetail {
  /** ISO 8601 UTC timestamp of the trader's last trade in this market */
  last_trade_at?: string;
  /** Concise standardized market metadata */
  market?: HistoryMarket;
  /** Detailed order fill events (present only when include_orders=true) */
  orders?: UserOrder[];
  /** Realized net PnL in micro-USD (6 decimals) */
  pnl?: number;
  /** Return on investment percentage in this market */
  roi?: number;
  /** Total traded volume in this market in micro-USD (6 decimals) */
  volume?: number;
}

/**
 * Data model for MonitorTrader
 */
export interface MonitorTrader {
  /** Canonical 42-character hexadecimal Ethereum/Polygon wallet address */
  address?: string;
  /** Polymarket public username */
  name?: string;
}

/**
 * Data model for OrderInfo
 */
export interface OrderInfo {
  /** Cryptographic EIP-712 order hash identifying the unique off-chain order */
  order_hash?: string;
  /** Original clob order shares capacity in 10^6 scale */
  shares?: string;
  /** Signature scheme encoding (0: Direct EOA, 1: Magic / Proxy Wallet, 2: Gnosis Safe, 3: Deposit Wallet (ERC-1271)) */
  signature_type?: number;
  /** Unix epoch seconds when the order was signed */
  timestamp?: string;
  /** Original clob order notional value in micro-USDC (10^6 scale) */
  usdc?: string;
}

/**
 * Data model for QuoteSubscriptionRequest
 */
export interface QuoteSubscriptionRequest {
  billing_cycle?: string;
  promo_code?: string;
  tier?: string;
}

/**
 * Data model for QuoteSubscriptionResponse
 */
export interface QuoteSubscriptionResponse {
  amount_to_pay?: number;
  billing_cycle?: string;
  can_afford?: boolean;
  current_balance?: number;
  current_billing_cycle?: string;
  current_license?: string;
  current_tier?: string;
  discount_amount?: number;
  duration_days?: number;
  is_active?: boolean;
  license?: string;
  message?: string;
  original_price?: number;
  prorated_credit?: number;
  tier?: string;
}

/**
 * Data model for SubscribeRequest
 */
export interface SubscribeRequest {
  billing_cycle?: string;
  idempotency_key?: string;
  promo_code?: string;
  tier?: string;
}

/**
 * Data model for SubscribeResponse
 */
export interface SubscribeResponse {
  subscription?: UserSubscription;
  user?: UserProfile;
}

/**
 * Data model for TagStat
 */
export interface TagStat {
  /** Passive maker volume in micro-USD (6 decimals) */
  maker_volume?: number;
  /** Number of markets traded in this tag */
  markets_count?: number;
  /** Realized net PnL in micro-USD (6 decimals) */
  pnl?: number;
  /** Return on investment percentage for this tag */
  roi?: number;
  /** Category tag URL slug (e.g. "crypto", "politics", "sports") */
  slug?: string;
  /** Aggressive taker volume in micro-USD (6 decimals) */
  taker_volume?: number;
  /** Aggregated trading volume in micro-USD (6 decimals) */
  volume?: number;
  /** Win rate percentage for this tag (0.0 to 100.0) */
  win_rate?: number;
  /** Number of profitable markets in this tag */
  wins_count?: number;
}

/**
 * Data model for Tier
 */
export interface Tier {
  /** Whether the tier is permitted to access REST API endpoints */
  allow_rest_api?: boolean;
  /** Whether the tier is permitted to access real-time stream endpoints */
  allow_stream?: boolean;
  /** Whether this tier supports a trial subscription */
  allow_trial?: boolean;
  /** Record creation timestamp */
  created_at?: string;
  /** Unique tier identifier (e.g. "free", "starter", "individual", "builder") */
  id?: string;
  /** Relative tier rank for upgrade comparison (0=free, 1=starter, etc.) */
  level?: number;
  /** License type: "personal" or "builder" */
  license?: string;
  /** Maximum API queries allowed per 24-hour UTC window (0 = unlimited) */
  max_daily_requests?: number;
  /** Maximum aggregated streaming seconds allowed per 24-hour UTC window */
  max_daily_stream_seconds?: number;
  /** Maximum wallet addresses that can be filtered per stream */
  max_filter_addrs?: number;
  /** Maximum market series allowed across active streams (0 = disabled) */
  max_filter_series?: number;
  /** Maximum market tags allowed across active streams (0 = disabled) */
  max_filter_tags?: number;
  /** Maximum concurrent API keys allowed per account */
  max_keys?: number;
  /** Maximum unfiltered streams allowed */
  max_naked_streams?: number;
  /** Maximum API queries allowed per second */
  max_qps?: number;
  /** Maximum concurrent active SSE connections per account */
  max_sessions?: number;
  /** Maximum persistent stream IDs the user can create */
  max_streams?: number;
  /** Monthly credit quota allocated to this tier */
  monthly_credits?: number;
  /** Display title of the tier */
  name?: string;
  /** 6 decimals, micro-USD (e.g. 99_000_000 = 99 USD) */
  price_monthly?: number;
  /** 6 decimals, micro-USD (e.g. 237_000_000 = 237 USD) */
  price_quarterly?: number;
  /** 6 decimals, micro-USD for trial (e.g. 10_000_000 = 10 USD) */
  price_trial?: number;
  /** 6 decimals, micro-USD (e.g. 499_000_000 = 499 USD) */
  price_yearly?: number;
  /** Duration in days for trial subscription (e.g. 5) */
  trial_duration_days?: number;
  /** Last modification timestamp */
  updated_at?: string;
}

/**
 * Data model for TraderHistoryResponse
 */
export interface TraderHistoryResponse {
  /** Paginated list of market settlement details */
  history?: MarketSettlementDetail[];
  /** Total count of matching market positions for pagination */
  total_count?: number;
}

/**
 * Data model for TraderHourlyStatsResponse
 */
export interface TraderHourlyStatsResponse {
  /** Chronological array of 1-hour performance metrics */
  stats?: HourlyStat[];
}

/**
 * Data model for TraderIdentity
 */
export interface TraderIdentity {
  /** Checksummed 0x-prefixed EVM wallet address */
  address?: string;
  /** Custom display name or Polymarket profile username */
  name?: string;
  /** ISO 8601 UTC timestamp of Polymarket profile creation */
  profile_created_at?: string;
  /** Public avatar image URL */
  profile_image?: string;
  /** Linked X (formerly Twitter) social handle */
  x_username?: string;
}

/**
 * Data model for TraderProfileResponse
 */
export interface TraderProfileResponse {
  /** ISO 8601 UTC timestamp of trader's most recent trade across the platform */
  last_trade_at?: string;
  /** Public identity dossier of the trader */
  profile?: TraderIdentity;
  /** Trader's pUSD balance in micro-pUSD (6 decimals, e.g. 1000000 = 1 pUSD) */
  pusd_balance?: number;
  /** Polymarket Taker Rebate Program tier level (0-6: 0=Tier 0, 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Diamond, 6=Obsidian) */
  taker_tier?: number;
  /** Descriptive taker rebate tier name ("Tier 0", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Obsidian", or empty string if unsynced) */
  taker_tier_name?: string;
  /** Performance breakdown across top 5 categories in last 30 days */
  top_tags?: TagStat[];
  /** Rolling 30-day taker Weighted Volume (wV) in USD, calculated by Trade Size * (1 - Entry Price) * Category Weight * Bonuses */
  weighted_volume?: number;
}

/**
 * Data model for TraderSummary
 */
export interface TraderSummary {
  /** ISO 8601 UTC timestamp of trader's most recent trade across the platform */
  last_trade_at?: string;
  /** Number of distinct prediction markets traded in timeframe */
  markets_count?: number;
  /** Public identity dossier of the trader */
  profile?: TraderIdentity;
  /** Leaderboard ranking position (1-based) */
  rank?: number;
  /** Return on investment percentage over timeframe (e.g. 25.5 for 25.5%) */
  roi?: number;
  /** Realized net profit and loss in micro-USD (6 decimals, e.g. 1000000 = 1 USD) */
  total_pnl?: number;
  /** Aggregated trading volume in micro-USD (6 decimals) */
  total_volume?: number;
  /** Percentage of profitable closed positions (0.0 to 100.0) */
  win_rate?: number;
  /** Number of profitable settled markets in timeframe */
  wins_count?: number;
}

/**
 * Data model for UpdateSubscriptionRequest
 */
export interface UpdateSubscriptionRequest {
  addresses?: string[];
  series?: string[];
  tags?: string[];
}

/**
 * Data model for UserAPIKey
 */
export interface UserAPIKey {
  created_at?: string;
  key?: string;
  name?: string;
  status?: number;
}

/**
 * Data model for UserActiveSessionsResponse
 */
export interface UserActiveSessionsResponse {
  /** Array of active connected client session metadata */
  data?: ActiveSessionInfo[];
  /** Total concurrent active sessions currently running across all user streams */
  total_count?: number;
}

/**
 * Data model for UserCreateStreamRequest
 */
export interface UserCreateStreamRequest {
  addresses?: string[];
  name?: string;
  series?: string[];
  tags?: string[];
}

/**
 * Data model for UserKeysResponse
 */
export interface UserKeysResponse {
  data?: UserAPIKey[];
  total_count?: number;
}

/**
 * Data model for UserLedgerEntry
 */
export interface UserLedgerEntry {
  amount?: number;
  balance_after?: number;
  created_at?: string;
  reference_id?: string;
  type?: string;
}

/**
 * Data model for UserLedgerResponse
 */
export interface UserLedgerResponse {
  data?: UserLedgerEntry[];
  total_count?: number;
}

/**
 * Data model for UserOrder
 */
export interface UserOrder {
  /** Protocol trading fee deducted in micro-USD (6 decimals) */
  fee?: number;
  /** True if executed against resting book liquidity as a taker */
  is_taker?: boolean;
  /** Prediction outcome label (e.g. "Yes", "No") */
  outcome?: string;
  /** Filled outcome token shares (6 decimals) */
  shares?: number;
  /** Order execution side: "BUY" or "SELL" */
  side?: Side;
  /** ISO 8601 UTC timestamp of order fill execution */
  time?: string;
  /** Total collateral USDC transferred (6 decimals micro-USD) */
  usdc?: number;
}

/**
 * Data model for UserOrdersResponse
 */
export interface UserOrdersResponse {
  /** Chronological list of compacted order fill events */
  orders?: UserOrder[];
}

/**
 * Data model for UserProfile
 */
export interface UserProfile {
  billing_cycle?: string;
  created_at?: string;
  deposit_address?: string;
  deposit_balance?: number;
  email?: string;
  is_expired?: boolean;
  status?: number;
  telegram_id?: number;
  tier?: string;
  tier_expires_at?: string;
  updated_at?: string;
}

/**
 * Data model for UserSessionHistoryResponse
 */
export interface UserSessionHistoryResponse {
  /** Array of historical stream session records */
  data?: UserSessionRecord[];
  /** Total count of historical session records */
  total_count?: number;
}

/**
 * Data model for UserSessionRecord
 */
export interface UserSessionRecord {
  /** Masked API credential used to authenticate the stream connection */
  api_key?: string;
  /** Remote IP address of the connected client */
  client_ip?: string;
  /** Diagnostic termination reason (e.g. client_closed, admin_force_disconnect, quota_exceeded) */
  close_reason?: string;
  /** ISO 8601 timestamp when the SSE connection was established */
  connected_at?: string;
  /** ISO 8601 timestamp when the connection was closed, or null if currently active */
  disconnected_at?: string;
  /** Total connection duration in seconds */
  duration_seconds?: number;
  /** Total number of live matched order events delivered over this connection */
  pushed_tx_count?: number;
  /** Target stream unique identifier (UUID) */
  stream_id?: string;
  /** HTTP User-Agent identifier of the client library or application */
  user_agent?: string;
}

/**
 * Data model for UserStreamResponse
 */
export interface UserStreamResponse {
  active_sessions?: number;
  addresses?: string[];
  created_at?: string;
  enabled?: boolean;
  id?: string;
  name?: string;
  series?: string[];
  tags?: string[];
  updated_at?: string;
}

/**
 * Data model for UserStreamsResponse
 */
export interface UserStreamsResponse {
  data?: UserStreamResponse[];
  total_count?: number;
}

/**
 * Data model for UserSubscription
 */
export interface UserSubscription {
  amount_paid?: number;
  billing_cycle?: string;
  created_at?: string;
  discount_amount?: number;
  duration_days?: number;
  expires_at?: string;
  original_price?: number;
  plan_tier?: string;
  promo_code?: string;
  prorated_credit?: number;
  starts_at?: string;
  status?: string;
}

/**
 * Data model for UserTelemetryResponse
 */
export interface UserTelemetryResponse {
  date?: string;
  endpoints?: Record<string, any>;
  total_requests?: number;
}

/**
 * Data model for UserUpdateKeyRequest
 */
export interface UserUpdateKeyRequest {
  name?: string;
  /** 1: Active, 0: Disabled */
  status?: number;
}

/**
 * Data model for UserUpdateStreamMetadataRequest
 */
export interface UserUpdateStreamMetadataRequest {
  enabled?: boolean;
  name?: string;
}

/**
 * Data model for UserWithdrawRequest
 */
export interface UserWithdrawRequest {
  network: string;
  to_address: string;
  token: string;
}

/**
 * Data model for UserWithdrawResponse
 */
export interface UserWithdrawResponse {
  user?: UserProfile;
  withdrawal?: Withdrawal;
}

/**
 * Data model for ValidatePromoCodeRequest
 */
export interface ValidatePromoCodeRequest {
  billing_cycle?: string;
  code?: string;
  tier?: string;
}

/**
 * Data model for ValidatePromoCodeResponse
 */
export interface ValidatePromoCodeResponse {
  amount_to_pay?: number;
  code?: string;
  discount_amount?: number;
  message?: string;
  original_price?: number;
  prorated_credit?: number;
  valid?: boolean;
}

/**
 * Data model for Withdrawal
 */
export interface Withdrawal {
  /** Full balance amount withdrawn in micro-USD */
  amount?: number;
  /** Withdrawal request creation timestamp */
  created_at?: string;
  id?: number;
  /** User's most recent deposit timestamp */
  last_deposit_at?: string;
  /** "bsc" or "polygon" */
  network?: string;
  /** Reason recorded upon rejection */
  reject_reason?: string;
  /** Administrative review timestamp */
  reviewed_at?: string;
  /** "pending", "completed", "rejected" */
  status?: string;
  /** Destination EVM wallet address */
  to_address?: string;
  /** "USDC" or "USDT" */
  token?: string;
  /** Transaction hash on destination network */
  tx_hash?: string;
  /** Last modification timestamp */
  updated_at?: string;
  user_email?: string;
  user_id?: number;
}
