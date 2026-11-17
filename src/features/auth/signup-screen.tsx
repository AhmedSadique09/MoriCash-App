import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/check-row";
import { Field } from "@/components/ui/field";
import { KeyboardAvoid } from "@/components/ui/keyboard-avoid";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import { isValidEmail } from "@/lib/validation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

import { LinkButton } from "./link-button";

const EMAIL_ERROR = "Enter a valid email, like name@example.com.";
const UNAVAILABLE_MESSAGE = "Not part of this prototype yet";

const showUnavailable = () => toast(UNAVAILABLE_MESSAGE);

export function SignupScreen() {
  const router = useRouter();
  const email = useOnboardingStore((state) => state.form.email);
  const terms = useOnboardingStore((state) => state.form.terms);
  const patchForm = useOnboardingStore((state) => state.patchForm);
  const startOtp = useOnboardingStore((state) => state.startOtp);
  const [isEmailTouched, setIsEmailTouched] = useState(false);

  const isEmailValid = isValidEmail(email);
  const emailError =
    isEmailTouched && email.length > 0 && !isEmailValid ? EMAIL_ERROR : undefined;
  const canContinue = isEmailValid && terms;

  const handleContinue = () => {
    startOtp();
    router.push("/otp");
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
            onChangeText={(text) => patchForm({ email: text.trim() })}
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
            disabled={!canContinue}
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
