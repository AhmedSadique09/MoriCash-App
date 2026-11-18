import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { KeyboardAvoid } from "@/components/ui/keyboard-avoid";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import type { UserProfile } from "@/interfaces/auth.interface";
import { resetTo } from "@/lib/navigation";
import type { CountryCode } from "@/lib/phone";
import { authService, getApiError } from "@/services/auth.service";
import { useOnboardingStore, type User } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";
import { loginSchema, validateForm } from "@/validation";

const OFFLINE_MESSAGE = "Can't reach MoriCash. Check your connection and try again.";

type LoginFailure = { fieldError?: string; toastMessage?: string };

/** The backend sends dates as YYYY-MM-DD; the app keeps DD/MM/YYYY. */
function toAppDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function toCountryCode(value: string, country: UserProfile["country"]): CountryCode {
  if (value === "+81" || value === "+63") return value;
  return country === "PH" ? "+63" : "+81";
}

/** Maps the backend's profile to the user shape the Home and KYC screens read. */
function toStoreUser(profile: UserProfile): User {
  return {
    first: profile.firstName,
    last: profile.lastName,
    name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    email: profile.email,
    country: profile.country,
    dob: toAppDate(profile.dateOfBirth),
    cc: toCountryCode(profile.phone.countryCode, profile.country),
    num: profile.phone.number,
  };
}

function firstDetailMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const first: unknown = details[0];
  if (typeof first !== "object" || first === null || !("message" in first)) {
    return undefined;
  }
  return typeof first.message === "string" ? first.message : undefined;
}

/** Wrong credentials and field errors go under the form; everything else is a toast. */
function describeFailure(error: unknown): LoginFailure {
  const apiError = getApiError(error);
  if (!apiError) return { toastMessage: OFFLINE_MESSAGE };
  if (apiError.code === "INVALID_CREDENTIALS") return { fieldError: apiError.message };
  if (apiError.code === "VALIDATION_ERROR") {
    return { fieldError: firstDetailMessage(apiError.details) ?? apiError.message };
  }
  return { toastMessage: apiError.message };
}

export function LoginScreen() {
  const router = useRouter();
  const savedEmail = useOnboardingStore((state) => state.form.loginEmail);
  const accountEmail = useOnboardingStore((state) => state.user?.email ?? "");
  const patchForm = useOnboardingStore((state) => state.patchForm);

  const [email, setEmail] = useState(savedEmail || accountEmail);
  // The password is never written to the store.
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const isBusyRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const trimmedEmail = email.trim();
  const form = validateForm(loginSchema, { email: trimmedEmail, password });

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setServerError("");
    patchForm({ loginEmail: text.trim() });
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setServerError("");
  };

  const showFailure = (error: unknown) => {
    const failure = describeFailure(error);
    if (failure.fieldError) setServerError(failure.fieldError);
    if (failure.toastMessage) toast(failure.toastMessage);
  };

  const handleLogin = async () => {
    if (isBusyRef.current || !form.isValid) return;
    isBusyRef.current = true;
    setIsLoading(true);
    setServerError("");
    try {
      const session = await authService.login(form.values.email, form.values.password);
      if (!isMountedRef.current) return;
      useOnboardingStore.setState({ user: toStoreUser(session.user) });
      resetTo(router, "/home");
      toast(`Welcome back, ${session.user.firstName}`);
    } catch (error: unknown) {
      if (isMountedRef.current) showFailure(error);
    } finally {
      isBusyRef.current = false;
      if (isMountedRef.current) setIsLoading(false);
    }
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

          {/* Field reserves a 24px helper/error line; only the password shows a server error. */}
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
            hideFooter
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            error={serverError || undefined}
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
          <Button
            label="Log in"
            onPress={handleLogin}
            disabled={!form.isValid}
            isLoading={isLoading}
          />
        </Footer>
      </KeyboardAvoid>
    </Screen>
  );
}
