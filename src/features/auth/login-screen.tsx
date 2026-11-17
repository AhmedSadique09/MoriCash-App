import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView } from "react-native";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { KeyboardAvoid } from "@/components/ui/keyboard-avoid";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import { resetTo } from "@/lib/navigation";
import { isValidEmail } from "@/lib/validation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

export function LoginScreen() {
  const router = useRouter();
  const savedEmail = useOnboardingStore((state) => state.form.loginEmail);
  const accountEmail = useOnboardingStore((state) => state.user?.email ?? "");
  const patchForm = useOnboardingStore((state) => state.patchForm);
  const loginDemo = useOnboardingStore((state) => state.loginDemo);

  const [email, setEmail] = useState(savedEmail || accountEmail);
  // The password is never written to the store.
  const [password, setPassword] = useState("");

  const trimmedEmail = email.trim();
  const canSubmit = isValidEmail(trimmedEmail) && password.length > 0;

  const handleEmailChange = (text: string) => {
    setEmail(text);
    patchForm({ loginEmail: text.trim() });
  };

  const handleLogin = () => {
    const user = loginDemo(trimmedEmail);
    resetTo(router, "/home");
    toast(`Welcome back, ${user.first}`);
  };

  return (
    <Screen>
      <KeyboardAvoid>
        <TopBar />
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pt-1 pb-7"
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
          >
            Welcome back
          </Text>
          <Text className="leading-[22px] text-ink-2">
            Log in with your email and password.
          </Text>

          {/* Field reserves a 24px helper/error line that this form never uses. */}
          <Field
            className="-mb-[24px]"
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />
          <Field
            className="-mb-[24px]"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            autoCapitalize="none"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Forgot password?"
            onPress={() => toast("Not part of this prototype yet")}
            className="min-h-[44px] justify-center self-start"
          >
            <Text className="font-text-semibold text-[14px] text-sky">
              Forgot password?
            </Text>
          </Pressable>
        </ScrollView>
        <Footer>
          <Button label="Log in" onPress={handleLogin} disabled={!canSubmit} />
        </Footer>
      </KeyboardAvoid>
    </Screen>
  );
}
