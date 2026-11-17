import { useEffect } from "react";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/theme/colors";

type SpinnerTone = "ink" | "dark";

type SpinnerProps = {
  size?: number;
  tone?: SpinnerTone;
};

const DEFAULT_SIZE = 16;
const LARGE_SIZE = 40;
const SPIN_MS = 900;
const FULL_TURN_DEG = 360;

// Prototype `.spin`: track ring + one colored arc. "dark" is for yellow buttons.
const TONES: Record<SpinnerTone, { track: string; arc: string }> = {
  ink: { track: colors["surface-2"], arc: colors.ink },
  dark: { track: "rgba(10,11,13,0.2)", arc: colors["on-sun"] },
};

/** Rotating ring. Static (arc at the top) when reduced motion is on. */
export function Spinner({ size = DEFAULT_SIZE, tone = "ink" }: SpinnerProps) {
  const isReduced = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isReduced) return;
    rotation.set(
      withRepeat(
        withTiming(FULL_TURN_DEG, { duration: SPIN_MS, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(rotation);
  }, [isReduced, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get()}deg` }],
  }));

  const palette = TONES[tone];

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: size >= LARGE_SIZE ? 3 : 2,
          borderColor: palette.track,
          borderTopColor: palette.arc,
        },
        spinStyle,
      ]}
    />
  );
}
