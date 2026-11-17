import { useRouter, type ImperativeRouter } from "expo-router";

import { resetTo } from "@/lib/navigation";
import { authService, getApiError } from "@/services/auth.service";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

import { LinkButton } from "./link-button";
import { PinEntryLayout, usePinEntry, type PinCompletion } from "./pin-create-screen";

const MISMATCH_ERROR = "Those PINs don't match. Try again.";
const OFFLINE_TOAST = "Can't reach MoriCash. Check your connection and try again.";
const EXPIRED_TOAST = "Your signup expired. Start again.";
const ACCOUNT_TAKEN_CODES: ReadonlySet<string> = new Set([
  "EMAIL_ALREADY_REGISTERED",
  "PHONE_ALREADY_REGISTERED",
]);
const EXPIRED_CODES: ReadonlySet<string> = new Set([
  "SIGNUP_SESSION_EXPIRED",
  "SIGNUP_STEP_INVALID",
]);
const UNAUTHORIZED_STATUS = 401;

/** The first `details[].message` of a validation error (PIN_TOO_WEAK, PIN_MISMATCH). */
function getFirstDetailMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const first: unknown = details[0];
  if (typeof first !== "object" || first === null || !("message" in first)) return undefined;
  return typeof first.message === "string" && first.message !== "" ? first.message : undefined;
}

/** The signup cannot continue: tell the user and send them back to the start. */
function restartSignup(router: ImperativeRouter, message: string): null {
  toast(message);
  authService.clearSignup();
  resetTo(router, "/signup");
  return null;
}

/** Turns a failed `createPin` into what the screen shows: a message for the error line, or `null`. */
function describeFailure(error: unknown, router: ImperativeRouter): string | null {
  const apiError = getApiError(error);
  if (apiError === undefined) {
    toast(OFFLINE_TOAST);
    return null;
  }
  if (ACCOUNT_TAKEN_CODES.has(apiError.code)) return restartSignup(router, apiError.message);
  if (apiError.status === UNAUTHORIZED_STATUS || EXPIRED_CODES.has(apiError.code)) {
    return restartSignup(router, EXPIRED_TOAST);
  }
  return getFirstDetailMessage(apiError.details) ?? apiError.message;
}

/** Creates the account (and saves the access token), then moves on to Face ID. */
async function createAccount(
  router: ImperativeRouter,
  pin: string,
  confirmPin: string,
): Promise<string | null> {
  try {
    await authService.createPin(pin, confirmPin);
  } catch (error: unknown) {
    return describeFailure(error, router);
  }
  router.push("/biometrics");
  return null;
}

export function PinConfirmScreen() {
  const router = useRouter();
  const newPin = useOnboardingStore((state) => state.newPin);

  const { pin, error, shakeKey, handleKey, isBusy } = usePinEntry((value): PinCompletion => {
    if (value !== newPin) return MISMATCH_ERROR;
    // No signup token (for example the app restarted): the PIN call cannot work.
    if (!authService.hasSignupInProgress()) return restartSignup(router, EXPIRED_TOAST);
    return createAccount(router, newPin, value);
  });

  // The account is being created; leaving now would strand the request.
  const handleStartOver = () => {
    if (isBusy) return;
    router.back();
  };

  return (
    <PinEntryLayout
      title="Enter your PIN again"
      subtitle="Type it once more to confirm."
      pin={pin}
      error={error}
      shakeKey={shakeKey}
      onKey={handleKey}
    >
      <LinkButton label="Start over" onPress={handleStartOver} className="self-center" />
    </PinEntryLayout>
  );
}
