import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";

type RingTone = "neu" | "pos" | "neg";
type RingSize = "md" | "big";

type StatusRingProps = {
  icon: IconName;
  tone?: RingTone;
  size?: RingSize;
  pulse?: boolean;
  iconSize?: number;
};

const TONES: Record<RingTone, { bg: string; fg: string }> = {
  neu: { bg: colors["surface-2"], fg: colors.ink },
  pos: { bg: colors["pos-soft"], fg: colors.pos },
  neg: { bg: colors["neg-soft"], fg: colors.neg },
};

const SIZES: Record<
  RingSize,
  { diameter: number; iconSize: number; strokeWidth: number }
> = {
  md: { diameter: 76, iconSize: 34, strokeWidth: 1.75 },
  big: { diameter: 120, iconSize: 60, strokeWidth: 1.5 },
};

const PULSE_HALF_MS = 800;
const PULSE_SCALE = 1.06;

/** Big circular status glyph for result screens (KYC pending, Face ID, ...). */
export function StatusRing({
  icon,
  tone = "pos",
  size = "md",
  pulse = false,
  iconSize,
}: StatusRingProps) {
  const isReduced = useReducedMotion();
  const scale = useSharedValue(1);
  const palette = TONES[tone];
  const dims = SIZES[size];
  const shouldPulse = pulse && !isReduced;

  useEffect(() => {
    if (!shouldPulse) {
      scale.set(1);
      return;
    }
    const halfStep = { duration: PULSE_HALF_MS, easing: Easing.inOut(Easing.ease) };
    scale.set(
      withRepeat(
        withSequence(withTiming(PULSE_SCALE, halfStep), withTiming(1, halfStep)),
        -1,
      ),
    );
  }, [shouldPulse, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View
      aria-hidden
      style={[
        {
          width: dims.diameter,
          height: dims.diameter,
          borderRadius: dims.diameter / 2,
          backgroundColor: palette.bg,
          marginBottom: 18,
          alignItems: "center",
          justifyContent: "center",
        },
        animatedStyle,
      ]}
    >
      <Icon
        name={icon}
        size={iconSize ?? dims.iconSize}
        strokeWidth={dims.strokeWidth}
        color={palette.fg}
      />
    </Animated.View>
  );
}
