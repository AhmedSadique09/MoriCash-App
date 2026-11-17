import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { announce } from "@/lib/announce";
import { useToastStore } from "@/stores/toast-store";

import { Text } from "./text";

const TOAST_VISIBLE_MS = 2600;
const TOAST_FADE_MS = 200;
const TOAST_SLIDE_PX = 8;
/** Keeps the toast above the footer's primary button. */
const TOAST_BOTTOM_OFFSET = 100;

/** Mount once at the root. Drive it with `toast("message")`. */
export function ToastHost() {
  const id = useToastStore((state) => state.id);
  const message = useToastStore((state) => state.message);
  const insets = useSafeAreaInsets();
  const visible = useSharedValue(0);
  // Id of the toast whose timer already ran out. A newer id is shown at once,
  // so the hidden state is derived and never set synchronously inside the effect.
  const [dismissedId, setDismissedId] = useState(0);
  const isShown = id !== 0 && dismissedId !== id;

  useEffect(() => {
    if (id === 0) return;
    visible.set(withTiming(1, { duration: TOAST_FADE_MS }));
    // The live-region prop is Android-only; this speaks on iOS and Android alike.
    announce(message);
    const timer = setTimeout(() => {
      visible.set(withTiming(0, { duration: TOAST_FADE_MS }));
      setDismissedId(id);
    }, TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [id, message, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: visible.get(),
    transform: [{ translateY: (1 - visible.get()) * TOAST_SLIDE_PX }],
  }));

  return (
    <Animated.View
      aria-hidden={!isShown}
      style={[
        styles.host,
        { bottom: insets.bottom + TOAST_BOTTOM_OFFSET },
        animatedStyle,
      ]}
    >
      <View className="rounded-xl bg-ink px-4 py-[13px]">
        <Text className="font-text-medium text-[14px] text-bg">{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // pointerEvents lives in style (the prop is deprecated on react-native-web).
  host: { position: "absolute", left: 20, right: 20, pointerEvents: "none" },
});
