/** Wire types of the recipient lookup, PIN check and transfer endpoints (`/api/v1`). Money is USDT with at most 2 decimals. */

import type { TransactionDto } from "./wallet.interface";

/** The person behind a phone number, as the backend sends it. */
export interface RecipientInfo {
  /** First name and last initial, e.g. "Haruki M.". */
  name: string;
  countryCode: string;
  number: string;
}

/** `GET /recipients/lookup`. `found` is false when nobody has that number. */
export interface RecipientLookup {
  found: boolean;
  recipient?: RecipientInfo;
}

/** `POST /auth/pin/verify`. */
export interface PinVerifyResult {
  verified: true;
  /** Short-lived token that `POST /transfers` asks for. */
  pinToken: string;
  /** Seconds the token stays valid. */
  expiresIn: number;
}

/** Body of `POST /transfers`. */
export interface CreateTransferInput {
  recipient: { countryCode: string; number: string };
  amount: number;
  note?: string;
  via: "phone" | "qr";
  pinToken: string;
  /** 8..64 characters. The same key and body return the original result instead of a second debit. */
  idempotencyKey: string;
}

/** `POST /transfers`: the sender's "sent" row and the new wallet totals. */
export interface TransferResult {
  transaction: TransactionDto;
  balanceUsdt: number;
  sentTodayUsdt: number;
}
