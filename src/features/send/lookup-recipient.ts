import type { CountryCode } from "@/lib/phone";
import { getApiError } from "@/services/auth.service";
import { transferService } from "@/services/transfer.service";
import { toast } from "@/stores/toast-store";

import type { VerifyOutcome } from "./send-logic";

const OFFLINE_TOAST = "Can't reach MoriCash. Check your connection and try again.";
const SELF_ERROR_CODE = "CANNOT_SEND_TO_SELF";
const UNAUTHORIZED_STATUS = 401;
/** Index of the "Registered on MoriCash" check in `phoneChecks`. */
const REGISTERED_CHECK = 1;

const NOT_ON_MORICASH: VerifyOutcome = {
  look: "none",
  to: null,
  failAt: REGISTERED_CHECK,
  why: "No MoriCash account uses this number",
};

/**
 * Asks the server who owns the number and turns the answer into what the
 * recipient screen shows. Returns `null` when the check could not run (the
 * user was told why; the screen goes back to the keypad).
 */
export async function lookupOutcome(
  cc: CountryCode,
  num: string,
): Promise<VerifyOutcome | null> {
  try {
    const result = await transferService.lookupRecipient(cc, num);
    if (!result.found || !result.recipient) return NOT_ON_MORICASH;
    return {
      look: "found",
      to: null,
      failAt: -1,
      why: "",
      recipient: { name: result.recipient.name, cc, num },
    };
  } catch (error: unknown) {
    const apiError = getApiError(error);
    if (apiError === undefined) {
      toast(OFFLINE_TOAST);
      return null;
    }
    if (apiError.code === SELF_ERROR_CODE) {
      return {
        look: "self",
        to: null,
        failAt: REGISTERED_CHECK,
        why: "This is your own number",
        message: apiError.message,
      };
    }
    if (apiError.status !== UNAUTHORIZED_STATUS) toast(apiError.message);
    return null;
  }
}
