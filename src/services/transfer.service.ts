import type { ApiEnvelope } from "@/interfaces/auth.interface";
import type {
  CreateTransferInput,
  RecipientLookup,
  TransferResult,
} from "@/interfaces/transfer.interface";

import { HttpService } from "./base.service";

/**
 * Send money calls: the recipient lookup and the transfer itself. Both need the
 * access token, which `HttpService` attaches. Failures throw the axios error;
 * read its code with `getApiError(error)`.
 */
export class TransferService extends HttpService {
  /** Who owns this mobile number? 422 CANNOT_SEND_TO_SELF for the caller's own number. */
  async lookupRecipient(countryCode: string, number: string): Promise<RecipientLookup> {
    const body = await this.get<ApiEnvelope<RecipientLookup>>("recipients/lookup", {
      countryCode,
      number,
    });
    return body.data;
  }

  /** Moves the money. Send the same `idempotencyKey` when retrying the same transfer. */
  async createTransfer(input: CreateTransferInput): Promise<TransferResult> {
    const body = await this.post<ApiEnvelope<TransferResult>>("transfers", input);
    return body.data;
  }
}

export const transferService = new TransferService();
