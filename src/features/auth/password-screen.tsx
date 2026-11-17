import { useRouter, type ImperativeRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView } from "react-native";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { KeyboardAvoid } from "@/components/ui/keyboard-avoid";
import { RuleList } from "@/components/ui/rule-list";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import type { ApiError } from "@/interfaces/auth.interface";
import { resetTo } from "@/lib/navigation";
import { isStrongPassword, passwordRules } from "@/lib/validation";
import { authService, getApiError } from "@/services/auth.service";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";
import { colors } from "@/theme/colors";

const TOGGLE_ICON_SIZE = 18;
// The button is 32pt; 6pt on every side makes the touch target 44pt.
const TOGGLE_HIT_SLOP = 6;

const SESSION_EXPIRED_MESSAGE = "Your signup expired. Start again.";
const OFFLINE_MESSAGE = "Can't reach MoriCash. Check your connection and try again.";
const UNAUTHORIZED_STATUS = 401;

/** The backend lost the signup (token expired, or the step is out of order). */
function isSignupExpired(error: ApiError): boolean {
  return (
    error.status === UNAUTHORIZED_STATUS ||
    error.code === "SIGNUP_STEP_INVALID" ||
    error.code === "SIGNUP_SESSION_EXPIRED"
  );
}

function expireSignup(router: ImperativeRouter): void {
  toast(SESSION_EXPIRED_MESSAGE);
  authService.clearSignup();
  resetTo(router, "/signup");
}

/** First readable message of a `details: [{ field, message }]` list, if any. */
function firstDetailMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const items: unknown[] = details;
  for (const item of items) {
    const message = (item as { message?: unknown } | null)?.message;
    if (typeof message === "string" && message !== "") return message;
  }
  return undefined;
}

function reportPasswordError(error: unknown, router: ImperativeRouter): void {
  const apiError = getApiError(error);
  if (!apiError) {
    // No answer from the server. Without a signup token there is nothing to retry.
    if (authService.hasSignupInProgress()) toast(OFFLINE_MESSAGE);
    else expireSignup(router);
    return;
  }
  if (isSignupExpired(apiError)) {
    expireSignup(router);
    return;
  }
  if (apiError.code === "VALIDATION_ERROR") {
    toast(firstDetailMessage(apiError.details) ?? apiError.message);
    return;
  }
  toast(apiError.message);
}

type VisibilityToggleProps = {
  isShown: boolean;
  onPress: () => void;
};

function VisibilityToggle({ isShown, onPress }: VisibilityToggleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isShown ? "Hide password" : "Show password"}
      hitSlop={TOGGLE_HIT_SLOP}
      onPress={onPress}
      className="h-8 w-8 items-center justify-center rounded-[10px]"
    >
      <Icon
        name={isShown ? "eyeOff" : "eye"}
        size={TOGGLE_ICON_SIZE}
        color={colors["ink-2"]}
      />
    </Pressable>
  );
}

export function PasswordScreen() {
  const router = useRouter();
  const pw = useOnboardingStore((state) => state.form.pw);
  const patchForm = useOnboardingStore((state) => state.patchForm);
  const [isShown, setIsShown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await authService.createPassword(pw);
    } catch (error: unknown) {
      reportPasswordError(error, router);
      return;
    } finally {
      setIsSubmitting(false);
    }
    router.push("/details");
  };

  const rules = passwordRules(pw);
  const ruleItems = [
    { label: "At least 8 characters", ok: rules.len },
    { label: "At least one number", ok: rules.num },
    { label: "At least one capital letter", ok: rules.up },
  ];

  return (
    <Screen>
      <KeyboardAvoid>
        <ObBar step={3} total={5} />
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pt-1 pb-7"
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
          >
            Create a password
          </Text>
          <Text className="leading-[22px] text-ink-2">
            You&apos;ll use it with your email to log in on a new device.
          </Text>

          <Field
            label="Password"
            value={pw}
            onChangeText={(text) => patchForm({ pw: text })}
            secureTextEntry={!isShown}
            autoComplete="new-password"
            autoCapitalize="none"
            right={
              <VisibilityToggle
                isShown={isShown}
                onPress={() => setIsShown((shown) => !shown)}
              />
            }
          />

          <RuleList rules={ruleItems} />
        </ScrollView>

        <Footer>
          <Button
            label="Continue"
            disabled={!isStrongPassword(pw)}
            isLoading={isSubmitting}
            onPress={() => {
              void submit();
            }}
          />
        </Footer>
      </KeyboardAvoid>
    </Screen>
  );
}
