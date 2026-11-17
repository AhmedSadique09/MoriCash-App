import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";
import { cn } from "@/lib/cn";

const FOOTER_MIN_BOTTOM = 16;
const FOOTER_EXTRA_BOTTOM = 4;
/** The keyboard already clears the home indicator, so only a small gap remains. */
const FOOTER_KEYBOARD_BOTTOM = 12;

type ScreenProps = {
  children: ReactNode;
  className?: string;
};

/** Full-screen container: app background plus the top safe-area inset. */
export function Screen({ children, className }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn("flex-1 bg-bg", className)}
      style={{ paddingTop: insets.top }}
    >
      {children}
    </View>
  );
}

/** Sticky bottom action area that clears the home indicator. */
export function Footer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();
  const paddingBottom = isKeyboardVisible
    ? FOOTER_KEYBOARD_BOTTOM
    : Math.max(insets.bottom, FOOTER_MIN_BOTTOM) + FOOTER_EXTRA_BOTTOM;

  return (
    <View className="gap-[10px] bg-bg px-5 pt-3" style={{ paddingBottom }}>
      {children}
    </View>
  );
}
