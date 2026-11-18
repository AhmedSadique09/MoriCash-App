import type { ApiEnvelope } from "@/interfaces/auth.interface";
import type {
  ListTransactionsParams,
  TransactionDetail,
  TransactionDto,
  TransactionList,
  WalletSummary,
} from "@/interfaces/wallet.interface";

import { HttpService } from "./base.service";

/**
 * Wallet balance and transaction history. All calls need the access token
 * (sent by `HttpService`). Failures throw the axios error; read its code with
 * `getApiError(error)` from `auth.service`.
 */
export class WalletService extends HttpService {
  /** Home: balance, sent today and the daily limit. The first call creates the wallet. */
  async getWallet(): Promise<WalletSummary> {
    const body = await this.get<ApiEnvelope<WalletSummary>>("wallet");
    return body.data;
  }

  /** Activity: one page of transactions, newest first. Pass `nextCursor` as `cursor` for the next page. */
  async listTransactions({
    filter = "all",
    limit,
    cursor,
  }: ListTransactionsParams = {}): Promise<TransactionList> {
    const body = await this.get<ApiEnvelope<TransactionList>>("transactions", {
      filter,
      limit,
      cursor,
    });
    return body.data;
  }

  /** Transaction detail. Unknown or foreign ids answer 404 TRANSACTION_NOT_FOUND. */
  async getTransaction(id: string): Promise<TransactionDto> {
    const body = await this.get<ApiEnvelope<TransactionDetail>>(
      `transactions/${encodeURIComponent(id)}`,
    );
    return body.data.transaction;
  }
}

/** Shared instance. */
export const walletService = new WalletService();
