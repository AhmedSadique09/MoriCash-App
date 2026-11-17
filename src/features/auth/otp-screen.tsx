import { useRouter, type ImperativeRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { CodeBoxes } from "@/components/ui/code-boxes";
import { Keypad } from "@/components/ui/keypad";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import type { ApiError } from "@/interfaces/auth.interface";
import { announce } from "@/lib/announce";
import { resetTo } from "@/lib/navigation";
import { maskEmail } from "@/lib/validation";
import { authService, getApiError } from "@/services/auth.service";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

import { BottomSpacer } from "./bottom-spacer";
import { LinkButton } from "./link-button";

const CODE_LENGTH = 6;
const CHECK_DELAY_MS = 280;
const TICK_MS = 1000;
const RESEND_SECONDS = 30;
const DIGIT_PATTERN = /^\d$/;
const DELETE_KEY = "del";
const NETWORK_MESSAGE =
  "Can't reach MoriCash. Check your connection and try again.";
const SESSION_EXPIRED_MESSAGE = "Your signup expired. Start again.";
const HTTP_UNAUTHORIZED = 401;
const CODE_OTP_INVALID = "OTP_INVALID";
/** The signup session is gone on the server: the user has to start again. */
const SESSION_ENDED_CODES: ReadonlySet<string> = new Set([
  "SIGNUP_STEP_INVALID",
  "SIGNUP_SESSION_EXPIRED",
]);
/** Failures of the code itself, shown under the code boxes. */
const CODE_REJECTED_CODES: ReadonlySet<string> = new Set([
  CODE_OTP_INVALID,
  "OTP_EXPIRED",
  "OTP_ATTEMPTS_EXCEEDED",
]);

/** Whole seconds left until `resendAt`, re-evaluated once a second. */
function useResendSeconds(resendAt: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= resendAt) clearInterval(id);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [resendAt]);

  // resendAt is never more than RESEND_SECONDS ahead, so the clamp hides the
  // stale `now` for the single render right after a resend.
  const seconds = Math.ceil((resendAt - now) / TICK_MS);
  return Math.min(RESEND_SECONDS, Math.max(0, seconds));
}

type CodeEntryOptions = {
  onFirstDigit: () => void;
  onComplete: (code: string) => void;
  /** True while a request is running; keypad input is ignored then. */
  isLocked: () => boolean;
};

/** Keypad-driven 6-digit entry: the check runs shortly after the last digit. */
function useCodeEntry({ onFirstDigit, onComplete, isLocked }: CodeEntryOptions) {
  const [code, setCode] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleKey = (key: string) => {
    // A full code is waiting to be checked; ignore input until it clears.
    if (code.length === CODE_LENGTH || isLocked()) return;

    const isDelete = key === DELETE_KEY;
    if (!isDelete && !DIGIT_PATTERN.test(key)) return;

    const next = isDelete ? code.slice(0, -1) : code + key;
    if (next.length === 1) onFirstDigit();
    setCode(next);

    if (next.length === CODE_LENGTH) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setCode("");
        onComplete(next);
      }, CHECK_DELAY_MS);
    }
  };

  const reset = () => {
    clearTimer();
    setCode("");
  };

  return { code, handleKey, reset };
}

/** The backend sends `details.attemptsLeft` with a wrong code. */
function invalidCodeMessage(error: ApiError): string {
  const details = error.details;
  const left =
    typeof details === "object" && details !== null
      ? (details as { attemptsLeft?: unknown }).attemptsLeft
      : undefined;
  if (typeof left !== "number" || !Number.isFinite(left) || left <= 0) {
    return error.message;
  }
  return `${error.message} ${left} ${left === 1 ? "try" : "tries"} left.`;
}

function endExpiredSignup(router: ImperativeRouter): void {
  toast(SESSION_EXPIRED_MESSAGE);
  authService.clearSignup();
  resetTo(router, "/signup");
}

/**
 * Handles the failures every OTP call shares (offline, signup gone). Returns
 * the error when the caller still has to react to it.
 */
function settleSharedFailure(
  error: unknown,
  router: ImperativeRouter,
): ApiError | undefined {
  const apiError = getApiError(error);
  if (apiError === undefined) {
    toast(NETWORK_MESSAGE);
    return undefined;
  }
  const isSessionGone =
    apiError.status === HTTP_UNAUTHORIZED || SESSION_ENDED_CODES.has(apiError.code);
  if (!isSessionGone) return apiError;
  endExpiredSignup(router);
  return undefined;
}

/** Verify / resend calls: one at a time, and silent once the screen is gone. */
function useOtpRequests(onCodeRejected: (message: string) => void) {
  const router = useRouter();
  const isBusyRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /** Resolves true when the call succeeded and the screen is still open. */
  const run = async (
    action: () => Promise<unknown>,
    onFailure: (error: unknown) => void,
  ): Promise<boolean> => {
    if (isBusyRef.current) return false;
    if (!authService.hasSignupInProgress()) {
      endExpiredSignup(router);
      return false;
    }
    isBusyRef.current = true;
    try {
      await action();
      return isMountedRef.current;
    } catch (error) {
      if (isMountedRef.current) onFailure(error);
      return false;
    } finally {
      isBusyRef.current = false;
    }
  };

  const failVerify = (error: unknown) => {
    const apiError = settleSharedFailure(error, router);
    if (apiError === undefined) return;
    if (!CODE_REJECTED_CODES.has(apiError.code)) {
      toast(apiError.message);
      return;
    }
    onCodeRejected(
      apiError.code === CODE_OTP_INVALID
        ? invalidCodeMessage(apiError)
        : apiError.message,
    );
  };

  const failResend = (error: unknown) => {
    const apiError = settleSharedFailure(error, router);
    if (apiError !== undefined) toast(apiError.message);
  };

  const verify = async (code: string): Promise<void> => {
    const isVerified = await run(() => authService.verifyOtp(code), failVerify);
    if (isVerified) router.push("/password");
  };

  const resend = () => run(() => authService.resendOtp(), failResend);

  return { verify, resend, isBusy: () => isBusyRef.current };
}

export function OtpScreen() {
  const router = useRouter();
  const email = useOnboardingStore((state) => state.form.email);
  const resendAt = useOnboardingStore((state) => state.resendAt);
  const startOtp = useOnboardingStore((state) => state.startOtp);
  const [error, setError] = useState("");
  const secondsLeft = useResendSeconds(resendAt);

  const showCodeError = (message: string) => {
    setError(message);
    announce(message);
  };

  const { verify, resend, isBusy } = useOtpRequests(showCodeError);

  const { code, handleKey, reset } = useCodeEntry({
    onFirstDigit: () => setError(""),
    onComplete: (value) => void verify(value),
    isLocked: isBusy,
  });

  const handleResend = async () => {
    const isSent = await resend();
    if (!isSent) return;
    startOtp();
    reset();
    setError("");
    toast(`New code sent to ${email || "your email"}`);
  };

  const countdown = `Resend code in 0:${String(secondsLeft).padStart(2, "0")}`;

  return (
    <Screen>
      <ObBar step={2} total={5} />
      <View className="flex-1 px-5 pt-1">
        <Text
          accessibilityRole="header"
          className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          Check your email
        </Text>
        <Text className="leading-[22px] text-ink-2">
          Enter the 6-digit code we sent to{" "}
          <Text className="font-text-bold">{maskEmail(email)}</Text>.
        </Text>

        <CodeBoxes value={code} hasError={error.length > 0} />
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="mt-[6px] min-h-[18px] text-center font-text-medium text-[13px] text-neg"
        >
          {error}
        </Text>

        <View className="flex-row items-center justify-center gap-4">
          {secondsLeft > 0 ? (
            <Text className="text-[12px] leading-[17px] text-ink-3">
              {countdown}
            </Text>
          ) : (
            <LinkButton label="Resend code" onPress={() => void handleResend()} />
          )}
          <LinkButton label="Change email" onPress={() => router.back()} />
        </View>

        <View className="mt-auto">
          <Keypad onKey={handleKey} showDecimal={false} />
        </View>
      </View>
      <BottomSpacer />
    </Screen>
  );
}
