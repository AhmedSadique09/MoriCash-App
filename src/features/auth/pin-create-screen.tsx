import { useRouter } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";

import { Keypad } from "@/components/ui/keypad";
import { PinDots } from "@/components/ui/pin-dots";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import { announce } from "@/lib/announce";
import { isWeakPin } from "@/lib/validation";
import { useOnboardingStore } from "@/stores/onboarding-store";

import { BottomSpacer } from "./bottom-spacer";

const PIN_LENGTH = 6;
const AUTO_ADVANCE_MS = 280;
const DELETE_KEY = "del";
const DIGIT_PATTERN = /^\d$/;
const WEAK_PIN_ERROR =
  "That PIN is easy to guess. Avoid repeated or consecutive digits.";

/**
 * Keypad-driven 6-digit PIN entry shared by the create and confirm screens.
 * `onComplete` runs shortly after the last digit and returns an error message,
 * or `null` once it has accepted the PIN (and navigated on).
 */
export function usePinEntry(onComplete: (pin: string) => string | null) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleKey = (key: string) => {
    // A full PIN is waiting to be checked; ignore input until it clears.
    if (pin.length === PIN_LENGTH) return;
    if (key === DELETE_KEY) {
      setPin(pin.slice(0, -1));
      return;
    }
    if (!DIGIT_PATTERN.test(key)) return;

    const next = `${pin}${key}`;
    setPin(next);
    if (next.length === 1) setError("");
    if (next.length < PIN_LENGTH) return;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setPin("");
      const message = onComplete(next);
      if (message === null) return;
      setError(message);
      announce(message);
      setShakeKey((count) => count + 1);
    }, AUTO_ADVANCE_MS);
  };

  return { pin, error, shakeKey, handleKey };
}

type PinEntryLayoutProps = {
  title: string;
  subtitle: string;
  pin: string;
  error: string;
  shakeKey: number;
  onKey: (key: string) => void;
  /** Extra content between the error line and the keypad. */
  children?: ReactNode;
};

export function PinEntryLayout({
  title,
  subtitle,
  pin,
  error,
  shakeKey,
  onKey,
  children,
}: PinEntryLayoutProps) {
  return (
    <Screen>
      <ObBar step={5} total={5} />
      <View className="flex-1 px-5 pt-1">
        <Text
          accessibilityRole="header"
          className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          {title}
        </Text>
        <Text className="leading-[22px] text-ink-2">{subtitle}</Text>

        <PinDots length={pin.length} shakeKey={shakeKey} />
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="mt-[6px] min-h-[18px] text-center font-text-medium text-[13px] text-neg"
        >
          {error}
        </Text>
        {children}

        <View className="mt-auto">
          <Keypad onKey={onKey} showDecimal={false} />
        </View>
      </View>
      <BottomSpacer />
    </Screen>
  );
}

export function PinCreateScreen() {
  const router = useRouter();
  const setNewPin = useOnboardingStore((state) => state.setNewPin);

  const { pin, error, shakeKey, handleKey } = usePinEntry((value) => {
    if (isWeakPin(value)) return WEAK_PIN_ERROR;
    setNewPin(value);
    router.push("/pin-confirm");
    return null;
  });

  return (
    <PinEntryLayout
      title="Create your PIN"
      subtitle="6 digits to unlock the app and approve payments. Avoid birthdays and repeated numbers."
      pin={pin}
      error={error}
      shakeKey={shakeKey}
      onKey={handleKey}
    />
  );
}
