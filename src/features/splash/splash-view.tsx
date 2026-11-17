import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { Logo } from "@/components/ui/logo";
import { Text } from "@/components/ui/text";

const MARK_MS = 600;
const MARK_START_SCALE = 0.7;
const RISE_MS = 500;
const RISE_OFFSET_PX = 10;
const WORD_DELAY_MS = 250;
const TAG_DELAY_MS = 400;
const TAG_OPACITY = 0.75;

type RiseProps = {
  delay: number;
  opacity?: number;
  children: ReactNode;
};

/** Fades and lifts its child into place after `delay`. */
function Rise({ delay, opacity = 1, children }: RiseProps) {
  const isReduced = useReducedMotion();
  const progress = useSharedValue(isReduced ? 1 : 0);

  useEffect(() => {
    if (isReduced) return;
    progress.set(
      withDelay(
        delay,
        withTiming(1, { duration: RISE_MS, easing: Easing.out(Easing.ease) }),
      ),
    );
  }, [delay, isReduced, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get() * opacity,
    transform: [{ translateY: (1 - progress.get()) * RISE_OFFSET_PX }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

/** Brand splash: the 森 tile pops in, then the wordmark and tagline rise. */
export function SplashView() {
  const isReduced = useReducedMotion();
  const markProgress = useSharedValue(isReduced ? 1 : 0);

  useEffect(() => {
    if (isReduced) return;
    markProgress.set(
      withTiming(1, {
        duration: MARK_MS,
        // Overshoots slightly past 1, like the prototype's pop.
        easing: Easing.bezier(0.2, 0.8, 0.2, 1.2),
      }),
    );
  }, [isReduced, markProgress]);

  const markStyle = useAnimatedStyle(() => {
    const progress = markProgress.get();
    return {
      opacity: Math.min(1, progress),
      transform: [{ scale: MARK_START_SCALE + (1 - MARK_START_SCALE) * progress }],
    };
  });

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-sun">
      <Animated.View style={markStyle}>
        <Logo size={104} tone="ink" />
      </Animated.View>
      <Rise delay={WORD_DELAY_MS}>
        <Text className="font-display text-[36px] tracking-[-1.08px] text-on-sun">
          MoriCash
        </Text>
      </Rise>
      <Rise delay={TAG_DELAY_MS} opacity={TAG_OPACITY}>
        <Text className="text-[15px] text-on-sun">
          Send USDT with a phone number
        </Text>
      </Rise>
    </View>
  );
}
