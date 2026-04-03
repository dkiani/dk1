// ============================================
// Core Types — Tradovate-ready schema
// ============================================

export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed";
export type AssetClass = "futures" | "options" | "stocks" | "forex" | "crypto";
export type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export interface Trade {
  id: string;
  userId: string;
  // Instrument
  symbol: string;
  assetClass: AssetClass;
  // Execution
  direction: TradeDirection;
  status: TradeStatus;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryTime: string; // ISO timestamp
  exitTime?: string;
  // Financials
  pnl?: number;
  pnlPercent?: number;
  fees?: number;
  // Metadata
  strategy?: string;
  timeFrame?: TimeFrame;
  tags?: string[];
  notes?: string;
  // Screenshots
  screenshots?: Screenshot[];
  // Tradovate integration (future)
  tradovateOrderId?: string;
  tradovateAccountId?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Screenshot {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  annotations?: Annotation[];
  uploadedAt: string;
}

export interface Annotation {
  type: "entry" | "exit" | "note" | "arrow" | "line";
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  // Pre-session
  mood: number; // 1-5
  sleepHours?: number;
  preMarketNotes?: string;
  // Linked trades
  tradeIds: string[];
  // Post-session
  lessonsLearned?: string;
  mistakes?: string;
  wins?: string;
  rating?: number; // 1-5 self-assessment
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface DailyStats {
  date: string;
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  biggestWin: number;
  biggestLoss: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  subscription: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tradovateLinked: boolean;
  createdAt: string;
}

export type SubscriptionTier = "free" | "student" | "premium";

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  stripePriceId: string;
  features: string[];
}
