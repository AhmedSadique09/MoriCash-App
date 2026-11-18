import type { ImperativeRouter } from "expo-router";

import type { CreateTransferInput, TransferResult } from "@/interfaces/transfer.interface";
import { authService, getApiError } from "@/services/auth.service";
import { transferService } from "@/services/transfer.service";
import { makeIdempotencyKey, useSendStore, type SendFlow } from "@/stores/send-store";
import { toast } from "@/stores/toast-store";
import { mapTransaction, useWalletStore } from "@/stores/wallet-store";

import { flowPerson } from "./flow-person";
import { parseAmount } from "./use-transfer-pipeline";

const OFFLINE_TOAST = "Can't reach MoriCash. Check your connection and try again.";
const PIN_EXPIRED_MESSAGE = "Your PIN check expired. Enter your PIN again.";
const UNEXPECTED_MESSAGE = "Something went wrong. Try again.";
const SECONDS_PER_MINUTE = 60;
const CENTS = 100;
const UNAUTHORIZED_STATUS = 401;
/** The server understood the transfer and said no (limits, funds, recipient, key reuse). */
const REFUSAL_STATUSES: ReadonlySet<number> = new Set([400, 404, 409, 422]);

function readNumber(details: unknown, key: string): number | undefined {
  if (typeof details !== "object" || details === null) return undefined;
  const value = (details as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

/** The PIN screen's error line for a failed PIN check, or `null` when it only needs a toast. */
function describePinFailure(error: unknown): string | null {
  const apiError = getApiError(error);
  if (apiError === undefined) {
    toast(OFFLINE_TOAST);
    return null;
  }
  if (apiError.code === "PIN_INVALID") {
    const left = readNumber(apiError.details, "attemptsLeft");
    if (left === undefined) return "Incorrect PIN.";
    return `Incorrect PIN. ${left} ${left === 1 ? "try" : "tries"} left.`;
  }
  if (apiError.code === "PIN_LOCKED") {
    const seconds = readNumber(apiError.details, "retryAfterSeconds") ?? 0;
    return `Too many attempts. Try again in ${Math.max(1, Math.ceil(seconds / SECONDS_PER_MINUTE))} min.`;
  }
  return apiError.status === UNAUTHORIZED_STATUS ? null : apiError.message;
}

/**
 * A refused transfer opens the tracking screen in its failed state with the
 * server's message. A dropped connection keeps the idempotency key so a retry
 * cannot debit twice; a refusal gets a fresh key (the next try may differ).
 */
function describeTransferFailure(router: ImperativeRouter, error: unknown): string | null {
  const apiError = getApiError(error);
  if (apiError === undefined) {
    toast(OFFLINE_TOAST);
    return null;
  }
  if (apiError.code === "PIN_TOKEN_INVALID") return PIN_EXPIRED_MESSAGE;
  if (apiError.status === UNAUTHORIZED_STATUS) return null;
  if (!REFUSAL_STATUSES.has(apiError.status)) {
    toast(apiError.message);
    return null;
  }
  useSendStore
    .getState()
    .patchFlow({ failure: apiError.message, idempotencyKey: makeIdempotencyKey() });
  router.replace("/send/track");
  return null;
}

function buildTransferInput(flow: SendFlow, pinToken: string): CreateTransferInput | null {
  const person = flowPerson(flow);
  const amount = Math.round(parseAmount(flow.amount) * CENTS) / CENTS;
  if (!person || amount <= 0) return null;
  const note = flow.note.trim();
  return {
    recipient: { countryCode: person.cc, number: person.num },
    amount,
    ...(note ? { note } : {}),
    via: flow.via,
    pinToken,
    idempotencyKey: flow.idempotencyKey,
  };
}

function completeTransfer(router: ImperativeRouter, result: TransferResult): void {
  const tx = mapTransaction(result.transaction);
  useWalletStore.getState().applyTransfer(tx, result.balanceUsdt, result.sentTodayUsdt);
  useSendStore.getState().patchFlow({ sent: tx, ref: result.transaction.ref, failure: null });
  router.replace("/send/track");
}

/**
 * The PIN screen's submit: checks the PIN, sends the transfer with the flow's
 * idempotency key, then opens the tracking screen. Returns the error line to
 * show under the PIN dots, or `null` when it moved on (or only toasted).
 */
export async function confirmTransfer(
  router: ImperativeRouter,
  pin: string,
): Promise<string | null> {
  const { flow } = useSendStore.getState();
  // Prototype switch "make this fail": simulated on the tracking screen, no API call.
  if (flow.shouldFail) {
    router.replace("/send/track");
    return null;
  }

  let pinToken: string;
  try {
    pinToken = (await authService.verifyPin(pin)).pinToken;
  } catch (error: unknown) {
    return describePinFailure(error);
  }

  const input = buildTransferInput(useSendStore.getState().flow, pinToken);
  if (input === null) return UNEXPECTED_MESSAGE;

  let result: TransferResult;
  try {
    result = await transferService.createTransfer(input);
  } catch (error: unknown) {
    return describeTransferFailure(router, error);
  }
  completeTransfer(router, result);
  return null;
}
