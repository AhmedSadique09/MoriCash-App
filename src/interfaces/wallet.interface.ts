/** Wire types of the wallet, activity and transaction endpoints (`/api/v1`). Money is USDT with at most 2 decimals. */

export type TransactionType = "deposit" | "sent" | "received";
export type TransactionStatus = "Completed" | "Processing" | "Failed";
export type TransactionFilter = "all" | "sent" | "received";

export interface TransactionTimelineEntry {
  title: string;
  /** ISO 8601. */
  time: string;
}

/** One transaction as the backend sends it (`TxDto`). */
export interface TransactionDto {
  id: string;
  type: TransactionType;
  /** "Added USDT" | "Sent to Haruki M." | "Received from Haruki M." */
  title: string;
  /** Deposit only: "Bank transfer". */
  sub?: string;
  asset: "USDT";
  /** Signed: negative when money leaves the wallet. */
  amount: number;
  status: TransactionStatus;
  /** "MC-DEP-1187" | "MC-P2P-483920". */
  ref: string;
  /** ISO 8601. */
  createdAt: string;
  whoName?: string;
  whoCountryCode?: string;
  whoNumber?: string;
  note?: string;
  via?: "phone" | "qr";
  method?: string;
  fee?: string;
  timeline: TransactionTimelineEntry[];
}

/** `GET /wallet`. */
export interface WalletSummary {
  balanceUsdt: number;
  sentTodayUsdt: number;
  dailyLimitUsdt: number;
  currency: "USDT";
}

/** `GET /transactions`: one page, newest first. `nextCursor` is null on the last page. */
export interface TransactionList {
  items: TransactionDto[];
  nextCursor: string | null;
}

/** `GET /transactions/:id`. */
export interface TransactionDetail {
  transaction: TransactionDto;
}

/** Query of `GET /transactions`. */
export interface ListTransactionsParams {
  filter?: TransactionFilter;
  /** 1..50, the backend defaults to 20. */
  limit?: number;
  cursor?: string;
}
