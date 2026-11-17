import { useRouter } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { Pressable, View, type TextStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import { Text } from "./text";

const PROGRESS_MS = 300;
const TRACK_RADIUS = 2;
const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };
const FILL_STYLE = {
  height: "100%",
  borderRadius: TRACK_RADIUS,
  backgroundColor: colors.ink,
} as const;

/** Falls back to popping the current route when no handler is supplied. */
function useBackHandler(onBack?: () => void): () => void {
  const router = useRouter();
  return onBack ?? (() => router.back());
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={4}
      onPress={onPress}
      className="h-[40px] w-[40px] items-center justify-center rounded-[12px] active:bg-surface-2"
    >
      <Icon name="chevL" />
    </Pressable>
  );
}

type TopBarProps = {
  title?: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: ReactNode;
};

/** 52px bar: back button, centered title, optional right slot (44 / 1fr / 44). */
export function TopBar({ title, onBack, hideBack = false, right }: TopBarProps) {
  const handleBack = useBackHandler(onBack);

  return (
    <View className="h-[52px] flex-row items-center px-3">
      <View className="w-[44px]">
        {hideBack ? null : <BackButton onPress={handleBack} />}
      </View>
      {title ? (
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="flex-1 text-center font-text-semibold text-[17px]"
        >
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}
      <View className="w-[44px] items-end">{right}</View>
    </View>
  );
}

type ProgressTrackProps = { step: number; total: number };

function ProgressTrack({ step, total }: ProgressTrackProps) {
  const isReduced = useReducedMotion();
  const safeTotal = Math.max(total, 1);
  const target = Math.min(Math.max(step / safeTotal, 0), 1);
  // Each step is its own route, so start one step back and animate into place.
  const fill = useSharedValue(
    isReduced ? target : Math.max(step - 1, 0) / safeTotal,
  );

  useEffect(() => {
    fill.set(isReduced ? target : withTiming(target, { duration: PROGRESS_MS }));
  }, [fill, isReduced, target]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.get() * 100}%` as const,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${total}`}
      accessibilityValue={{ min: 0, max: total, now: step }}
      className="mx-[10px] h-[4px] flex-1 overflow-hidden rounded-[2px] bg-surface-2"
    >
      <Animated.View style={[FILL_STYLE, fillStyle]} />
    </View>
  );
}

type ObBarProps = {
  step: number;
  total: number;
  onBack?: () => void;
  hideBack?: boolean;
};

/** Onboarding bar: back button, animated progress track, "n of total". */
export function ObBar({ step, total, onBack, hideBack = false }: ObBarProps) {
  const handleBack = useBackHandler(onBack);

  return (
    <View className="h-[52px] flex-row items-center px-3">
      <View className="w-[44px]">
        {hideBack ? null : <BackButton onPress={handleBack} />}
      </View>
      <ProgressTrack step={step} total={total} />
      <Text
        aria-hidden
        className="w-[44px] pr-[6px] text-right text-[12px] text-ink-3"
        style={TABULAR_NUMS}
      >
        {`${step} of ${total}`}
      </Text>
    </View>
  );
}

/** Empty 52px spacer for screens that show no bar content. */
export function PlainBar() {
  return <View className="h-[52px]" />;
}
