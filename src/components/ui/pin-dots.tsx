import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const PIN_LENGTH = 6;
const DOT_INDICES = Array.from({ length: PIN_LENGTH }, (_, index) => index);

// Prototype `@keyframes shake` (.35s in four equal steps): 0 -> -8 -> 8 -> -4 -> 0.
const SHAKE_STEP_MS = 350 / 4;

type PinDotsProps = {
  /** Digits entered so far (filled dots). */
  length: number;
  /** Bump to a new value > 0 to shake the row, e.g. after a wrong PIN. */
  shakeKey?: number;
};

export function PinDots({ length, shakeKey = 0 }: PinDotsProps) {
  const isReduced = useReducedMotion();
  const offsetX = useSharedValue(0);

  useEffect(() => {
    if (shakeKey <= 0 || isReduced) return;
    const step = (to: number) => withTiming(to, { duration: SHAKE_STEP_MS });
    offsetX.set(withSequence(step(-8), step(8), step(-4), step(0)));
  }, [shakeKey, isReduced, offsetX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.get() }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`${length} of ${PIN_LENGTH} digits entered`}
      accessibilityLiveRegion="polite"
      className="mb-[12px] mt-[34px] items-center"
    >
      <Animated.View style={[{ flexDirection: "row", gap: 18 }, shakeStyle]}>
        {DOT_INDICES.map((index) => (
          <View
            key={index}
            className={
              index < length
                ? "h-[14px] w-[14px] rounded-full bg-ink"
                : "h-[14px] w-[14px] rounded-full border-[1.5px] border-ink-3"
            }
          />
        ))}
      </Animated.View>
    </View>
  );
}
