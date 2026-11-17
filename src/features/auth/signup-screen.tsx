import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/check-row";
import { Field } from "@/components/ui/field";
import { KeyboardAvoid } from "@/components/ui/keyboard-avoid";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import type { ApiError } from "@/interfaces/auth.interface";
import { authService, getApiError } from "@/services/auth.service";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";
import { signupEmailSchema, validateForm } from "@/validation";

import { LinkButton } from "./link-button";

const UNAVAILABLE_MESSAGE = "Not part of this prototype yet";
const NETWORK_MESSAGE =
  "Can't reach MoriCash. Check your connection and try again.";
const HTTP_BAD_REQUEST = 400;
const HTTP_CONFLICT = 409;
const CODE_EMAIL_TAKEN = "EMAIL_ALREADY_REGISTERED";
const CODE_VALIDATION = "VALIDATION_ERROR";
const EMAIL_FIELD = "email";

const showUnavailable = () => toast(UNAVAILABLE_MESSAGE);

/** The first message the server gave for the email field, if any. */
function firstEmailDetail(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  for (const detail of details as unknown[]) {
    if (typeof detail !== "object" || detail === null) continue;
    const { field, message } = detail as { field?: unknown; message?: unknown };
    if (field === EMAIL_FIELD && typeof message === "string") return message;
  }
  return undefined;
}

/** Message for the email field when the server blamed the address itself. */
function emailFieldMessage(error: ApiError): string | undefined {
  if (error.status === HTTP_CONFLICT && error.code === CODE_EMAIL_TAKEN) {
    return error.message;
  }
  if (error.status === HTTP_BAD_REQUEST && error.code === CODE_VALIDATION) {
    return firstEmailDetail(error.details);
  }
  return undefined;
}

/** Puts a failed "start signup" call where the user will see it. */
function reportStartFailure(
  error: unknown,
  showEmailError: (message: string) => void,
): void {
  const apiError = getApiError(error);
  if (apiError === undefined) {
    toast(NETWORK_MESSAGE);
    return;
  }
  const fieldMessage = emailFieldMessage(apiError);
  if (fieldMessage !== undefined) {
    showEmailError(fieldMessage);
    return;
  }
  toast(apiError.message);
}

/** Sends the email to the backend, then opens the OTP screen. One request at a time. */
function useStartSignup(showEmailError: (message: string) => void) {
  const router = useRouter();
  const startOtp = useOnboardingStore((state) => state.startOtp);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRunningRef = useRef(false);

  const submit = async (email: string): Promise<void> => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsSubmitting(true);
    let isStarted = false;
    try {
      await authService.startSignup(email, true);
      isStarted = true;
    } catch (error) {
      reportStartFailure(error, showEmailError);
    } finally {
      isRunningRef.current = false;
      setIsSubmitting(false);
    }
    if (!isStarted) return;
    startOtp();
    router.push("/otp");
  };

  return { isSubmitting, submit };
}

export function SignupScreen() {
  const router = useRouter();
  const email = useOnboardingStore((state) => state.form.email);
  const terms = useOnboardingStore((state) => state.form.terms);
  const patchForm = useOnboardingStore((state) => state.patchForm);
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [serverEmailError, setServerEmailError] = useState<string>();
  const { isSubmitting, submit } = useStartSignup(setServerEmailError);

  const validation = validateForm(signupEmailSchema, {
    email,
    acceptTerms: terms,
  });
  const schemaEmailError = validation.isValid
    ? undefined
    : validation.errors.email;
  const emailError =
    serverEmailError ??
    (isEmailTouched && email.length > 0 ? schemaEmailError : undefined);

  const handleEmailChange = (text: string) => {
    patchForm({ email: text.trim() });
    setServerEmailError(undefined);
  };

  const handleContinue = () => {
    if (!validation.isValid || isSubmitting) return;
    setServerEmailError(undefined);
    void submit(validation.values.email);
  };

  return (
    <Screen>
      <KeyboardAvoid>
        <ObBar step={1} total={5} />
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pt-1 pb-7"
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
          >
            Create your account
          </Text>
          <Text className="leading-[22px] text-ink-2">
            Start with your email. We&apos;ll send you a code to confirm it.
          </Text>

          <Field
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={() => setIsEmailTouched(true)}
            error={emailError}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />

          <CheckboxRow
            checked={terms}
            onChange={(value) => patchForm({ terms: value })}
          >
            I&apos;m 18 or older and I agree to the{" "}
            <Text
              accessibilityRole="link"
              className="text-[14px] leading-[20px] text-ink-2 underline"
              onPress={showUnavailable}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              accessibilityRole="link"
              className="text-[14px] leading-[20px] text-ink-2 underline"
              onPress={showUnavailable}
            >
              Privacy Policy
            </Text>
            .
          </CheckboxRow>
        </ScrollView>

        <Footer>
          <Button
            label="Continue"
            disabled={!validation.isValid}
            isLoading={isSubmitting}
            onPress={handleContinue}
          />
          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-[12px] leading-[17px] text-ink-3">
              Already have an account?
            </Text>
            <LinkButton label="Log in" onPress={() => router.push("/login")} />
          </View>
        </Footer>
      </KeyboardAvoid>
    </Screen>
  );
}
