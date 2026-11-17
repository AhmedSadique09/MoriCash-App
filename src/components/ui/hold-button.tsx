import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import { Text } from "./text";

type HoldButtonProps = {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
};

const HOLD_MS = 1100;
/** Reduced motion keeps the deliberate press but drops the long fill. */
const HOLD_REDUCED_MS = 300;
const RELEASE_MS = 250;
const FILL_COLOR = "rgba(10, 11, 13, 0.22)";
const HINT = "Press and hold to confirm";
const ACTIVATE_ACTION = { name: "activate", label: "Confirm" } as const;

/** Primary button that only confirms after being held (money-moving actions). */
export function HoldButton({ label, onConfirm, disabled = false }: HoldButtonProps) {
  const reducedMotion = useReducedMotion();
  const holdMs = reducedMotion ? HOLD_REDUCED_MS : HOLD_MS;
  const progress = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };

  const release = () => {
    progress.set(withTiming(0, { duration: RELEASE_MS, easing: Easing.out(Easing.ease) }));
  };

  const handlePressIn = () => {
    clearTimer();
    progress.set(withTiming(1, { duration: holdMs, easing: Easing.linear }));
    timer.current = setTimeout(() => {
      timer.current = null;
      release();
      onConfirm();
    }, holdMs);
  };

  const handlePressOut = () => {
    // A completed hold already cleared the timer and reset the fill.
    if (timer.current === null) return;
    clearTimer();
    release();
  };

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.get() - 1) * width }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={HINT}
        accessibilityState={{ disabled }}
        accessibilityActions={[ACTIVATE_ACTION]}
        onAccessibilityAction={(event) => {
          if (!disabled && event.nativeEvent.actionName === ACTIVATE_ACTION.name) onConfirm();
        }}
        disabled={disabled}
        onLayout={handleLayout}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          "h-[52px] w-full flex-row items-center justify-center gap-2 overflow-hidden rounded-xl bg-sun",
          disabled && "opacity-[0.38]",
        )}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: FILL_COLOR,
              pointerEvents: "none",
            },
            fillStyle,
          ]}
        />
        <Icon name="lock" size={18} strokeWidth={2} color={colors["on-sun"]} />
        <Text className="font-text-semibold text-[16px] text-on-sun">{label}</Text>
      </Pressable>
      <Text aria-hidden className="mt-2 text-center text-[12px] text-ink-3">
        {HINT}
      </Text>
    </View>
  );
}
