import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
  type WithTimingConfig,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/theme/colors";

import { Coin } from "./coin";
import { Icon } from "./icon";
import type { IconName } from "./icon-paths";

type WinAsset = "usdt" | "mori" | "morx";
type WinTone = "pos" | "warn" | "neg";

type WinStageProps = {
  asset: WinAsset;
  tone?: WinTone;
  /** Accent for the halo, ripples, sparkles and coin glow. */
  glow?: string;
};

const STAGE_SIZE = 128;
const COIN_SIZE = 84;
const HALO_SIZE = 120;
const HALO_STROKE = 1.5;
const HALO_OPACITY = 0.6;
const HALO_DASH_COUNT = 40;
const HALO_DASH_FILL = 0.55;
const HALO_ROTATE_MS = 16000;

const COIN_IN_MS = 800;
const COIN_START_SCALE = 0.55;
const COIN_START_LIFT = 36;

const RIPPLE_INSET = 22;
const RIPPLE_MS = 1900;
const RIPPLE_END_SCALE = 2.2;
const RIPPLE_START_OPACITY = 0.55;
const RIPPLE_DELAYS_MS = [450, 800];

const TWINKLE_UP_MS = 1080;
const TWINKLE_DOWN_MS = 1320;
const TWINKLE_MIN_SCALE = 0.3;
const TWINKLE_ROTATE_DEG = 45;

const BADGE_SIZE = 34;
const BADGE_RING = 4;
const BADGE_RIGHT = 20;
const BADGE_BOTTOM = 18;
const BADGE_DELAY_MS = 650;
const BADGE_POP_MS = 450;
const BADGE_START_SCALE = 0.7;

const SPARK_PATH =
  "M5 0C5.4 3.6 6.4 4.6 10 5 6.4 5.4 5.4 6.4 5 10 4.6 6.4 3.6 5.4 0 5 3.6 4.6 4.6 3.6 5 0Z";

const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const COIN_EASING = Easing.bezier(0.2, 0.8, 0.25, 1.15);
const POP_EASING = Easing.bezier(0.2, 0.8, 0.2, 1.5);

type SparkPlacement = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  size: number;
  delayMs: number;
};

const SPARKS: SparkPlacement[] = [
  { top: 6, left: 12, size: 12, delayMs: 0 },
  { top: 18, right: 2, size: 9, delayMs: 600 },
  { bottom: 16, left: 0, size: 8, delayMs: 1100 },
  { bottom: 2, right: 22, size: 10, delayMs: 1600 },
];

const TONE_BADGE: Record<WinTone, { bg: string; icon: IconName }> = {
  pos: { bg: colors.pos, icon: "check" },
  warn: { bg: colors.warn, icon: "clock" },
  neg: { bg: colors.neg, icon: "x" },
};

/** One-shot 0 -> 1 progress that starts after `delayMs` (jumps to 1 if reduced). */
function useEntrance(
  delayMs: number,
  durationMs: number,
  easing: TimingEasing,
): SharedValue<number> {
  const isReduced = useReducedMotion();
  const progress = useSharedValue(isReduced ? 1 : 0);

  useEffect(() => {
    if (isReduced) return;
    progress.set(
      withDelay(delayMs, withTiming(1, { duration: durationMs, easing })),
    );
  }, [delayMs, durationMs, easing, isReduced, progress]);

  return progress;
}

type TimingEasing = NonNullable<WithTimingConfig["easing"]>;

type GlowProps = { glow: string };

function Halo({ glow }: GlowProps) {
  const isReduced = useReducedMotion();
  const turn = useSharedValue(0);

  useEffect(() => {
    if (isReduced) return;
    turn.set(
      withRepeat(
        withTiming(1, { duration: HALO_ROTATE_MS, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [isReduced, turn]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 360}deg` }],
  }));

  const radius = (HALO_SIZE - HALO_STROKE) / 2;
  const segment = (2 * Math.PI * radius) / HALO_DASH_COUNT;
  const dash = segment * HALO_DASH_FILL;

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 4, left: 4 },
        animatedStyle,
      ]}
    >
      <Svg width={HALO_SIZE} height={HALO_SIZE}>
        <Circle
          cx={HALO_SIZE / 2}
          cy={HALO_SIZE / 2}
          r={radius}
          fill="none"
          stroke={glow}
          strokeOpacity={HALO_OPACITY}
          strokeWidth={HALO_STROKE}
          strokeDasharray={`${dash} ${segment - dash}`}
        />
      </Svg>
    </Animated.View>
  );
}

type RippleProps = GlowProps & { delayMs: number };

function Ripple({ glow, delayMs }: RippleProps) {
  const progress = useEntrance(delayMs, RIPPLE_MS, EASE_OUT);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: RIPPLE_START_OPACITY * (1 - p),
      transform: [{ scale: 1 + (RIPPLE_END_SCALE - 1) * p }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: RIPPLE_INSET,
          left: RIPPLE_INSET,
          width: STAGE_SIZE - RIPPLE_INSET * 2,
          height: STAGE_SIZE - RIPPLE_INSET * 2,
          borderRadius: STAGE_SIZE / 2,
          borderWidth: 2,
          borderColor: glow,
        },
        animatedStyle,
      ]}
    />
  );
}

type SparkleProps = GlowProps & { placement: SparkPlacement };

function Sparkle({ glow, placement }: SparkleProps) {
  const { size, delayMs, ...offsets } = placement;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delayMs,
        withRepeat(
          withSequence(
            withTiming(1, { duration: TWINKLE_UP_MS, easing: EASE_IN_OUT }),
            withTiming(0, { duration: TWINKLE_DOWN_MS, easing: EASE_IN_OUT }),
          ),
          -1,
        ),
      ),
    );
  }, [delayMs, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p,
      transform: [
        { scale: TWINKLE_MIN_SCALE + (1 - TWINKLE_MIN_SCALE) * p },
        { rotate: `${TWINKLE_ROTATE_DEG * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[{ position: "absolute", width: size, height: size, ...offsets }, animatedStyle]}
    >
      <Svg width={size} height={size} viewBox="0 0 10 10">
        <Path d={SPARK_PATH} fill={glow} />
      </Svg>
    </Animated.View>
  );
}

function CoinHero({ asset, glow }: GlowProps & { asset: WinAsset }) {
  const progress = useEntrance(0, COIN_IN_MS, COIN_EASING);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: Math.min(1, Math.max(0, p)),
      transform: [
        { translateY: -COIN_START_LIFT * (1 - p) },
        { scale: COIN_START_SCALE + (1 - COIN_START_SCALE) * p },
      ],
    };
  });

  return (
    <Animated.View style={[{ width: COIN_SIZE, height: COIN_SIZE, zIndex: 2 }, animatedStyle]}>
      <Coin asset={asset} size={COIN_SIZE} />
      {/* Coin has no style prop, so the glow and bevel sit on an overlay. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: COIN_SIZE / 2,
            pointerEvents: "none",
            boxShadow: [
              { offsetX: 0, offsetY: 16, blurRadius: 36, spreadDistance: -12, color: glow },
              { offsetX: 0, offsetY: -4, blurRadius: 0, color: "rgba(0,0,0,0.12)", inset: true },
              { offsetX: 0, offsetY: 3, blurRadius: 0, color: "rgba(255,255,255,0.35)", inset: true },
            ],
          },
        ]}
      />
    </Animated.View>
  );
}

function Badge({ tone }: { tone: WinTone }) {
  const progress = useEntrance(BADGE_DELAY_MS, BADGE_POP_MS, POP_EASING);
  const badge = TONE_BADGE[tone];

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: Math.min(1, Math.max(0, p)),
      transform: [{ scale: BADGE_START_SCALE + (1 - BADGE_START_SCALE) * p }],
    };
  });

  const outer = BADGE_SIZE + BADGE_RING * 2;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          right: BADGE_RIGHT - BADGE_RING,
          bottom: BADGE_BOTTOM - BADGE_RING,
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: BADGE_SIZE / 2,
          backgroundColor: badge.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={badge.icon} size={18} strokeWidth={2.8} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

/** Celebratory result artwork: coin with halo, ripples, sparkles and a status badge. */
export function WinStage({ asset, tone = "pos", glow = colors.sun }: WinStageProps) {
  const isReduced = useReducedMotion();
  const hasEffects = tone !== "neg" && !isReduced;

  return (
    <View
      aria-hidden
      className="mb-4 items-center justify-center self-center"
      style={{ width: STAGE_SIZE, height: STAGE_SIZE }}
    >
      <Halo glow={glow} />
      {hasEffects
        ? RIPPLE_DELAYS_MS.map((delayMs) => (
            <Ripple key={delayMs} glow={glow} delayMs={delayMs} />
          ))
        : null}
      {hasEffects
        ? SPARKS.map((placement) => (
            <Sparkle key={placement.delayMs} glow={glow} placement={placement} />
          ))
        : null}
      <CoinHero asset={asset} glow={glow} />
      <Badge tone={tone} />
    </View>
  );
}
