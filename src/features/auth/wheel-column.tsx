import { useImperativeHandle, useRef, type Ref } from "react";
import {
  Platform,
  Pressable,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";

export const WHEEL_ITEM_HEIGHT = 36;
export const WHEEL_VIEWPORT_HEIGHT = 216;
/** Spacer above/below the list so the selected row sits in the middle band. */
export const WHEEL_SPACER_HEIGHT = (WHEEL_VIEWPORT_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

const PERSPECTIVE = 700;
const MAX_TILT_STEPS = 3;
const TILT_DEG_PER_STEP = 20;
const SCALE_LOSS_PER_STEP = 0.04;
const OPACITY_LOSS_PER_STEP = 0.25;
const MIN_OPACITY = 0.25;
const DIMMED_OPACITY = 0.35;
/** Below this drag-release velocity no momentum follows, so the wheel is at rest. */
const REST_VELOCITY = 0.05;

const ALIGN_CLASS = {
  left: "text-left pl-[14px]",
  center: "text-center",
  right: "text-right pr-[14px]",
} as const;

export type WheelAlign = keyof typeof ALIGN_CLASS;

export type WheelHandle = {
  /** Scrolls so the row at `index` sits in the middle band (animated unless reduced motion). */
  scrollToIndex: (index: number) => void;
};

type WheelItemProps = {
  label: string;
  index: number;
  scrollY: SharedValue<number>;
  isDimmed: boolean;
  align: WheelAlign;
  onPress: (index: number) => void;
};

function WheelItem({ label, index, scrollY, isDimmed, align, onPress }: WheelItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const signedSteps = index - scrollY.get() / WHEEL_ITEM_HEIGHT;
    const steps = Math.max(-MAX_TILT_STEPS, Math.min(MAX_TILT_STEPS, signedSteps));
    const distance = Math.abs(steps);
    return {
      opacity: isDimmed
        ? DIMMED_OPACITY
        : Math.max(MIN_OPACITY, 1 - distance * OPACITY_LOSS_PER_STEP),
      transform: [
        { perspective: PERSPECTIVE },
        { rotateX: `${-steps * TILT_DEG_PER_STEP}deg` },
        { scale: 1 - distance * SCALE_LOSS_PER_STEP },
      ],
    };
  });

  return (
    <Animated.View style={[{ height: WHEEL_ITEM_HEIGHT }, animatedStyle]}>
      <Pressable accessibilityRole="button" onPress={() => onPress(index)}>
        <Text
          allowFontScaling={false}
          className={cn(
            "h-[36px] text-[21px] leading-[36px] tabular-nums",
            ALIGN_CLASS[align],
            isDimmed && "text-ink-3",
          )}
          style={{ textAlignVertical: "center" }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

type Props = {
  ref?: Ref<WheelHandle>;
  label: string;
  items: readonly string[];
  initialIndex: number;
  /** Rows at or after this index are dimmed (e.g. days past the month length). */
  firstDimmedIndex?: number;
  align: WheelAlign;
  /** Relative width inside the wheels row. */
  flex: number;
  /** Called with the settled row index after a scroll comes to rest or a row is tapped. */
  onSettle: (index: number) => void;
};

export function WheelColumn({
  ref,
  label,
  items,
  initialIndex,
  firstDimmedIndex = items.length,
  align,
  flex,
  onSettle,
}: Props) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(initialIndex * WHEEL_ITEM_HEIGHT);
  const isPositioned = useRef(false);
  const reducedMotion = useReducedMotion();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const scrollToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: !reducedMotion });
  };

  useImperativeHandle(ref, () => ({ scrollToIndex }));

  // iOS honours `contentOffset`; Android needs a scroll once the content is laid out.
  const handleContentSizeChange = () => {
    if (isPositioned.current) return;
    isPositioned.current = true;
    scrollRef.current?.scrollTo({ y: initialIndex * WHEEL_ITEM_HEIGHT, animated: false });
  };

  const settleAt = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
    onSettle(Math.max(0, Math.min(items.length - 1, rawIndex)));
  };

  // Android never reports `velocity` on drag end, so a missing value would read as
  // "at rest" mid-fling and settle too early (clamping the day while the month
  // wheel is still passing February). There only the momentum end is trusted;
  // it also fires for a release with no momentum.
  const handleDragEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS !== "ios") return;
    const velocityY = event.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(velocityY) < REST_VELOCITY) settleAt(event);
  };

  const handlePressItem = (index: number) => {
    scrollToIndex(index);
    onSettle(index);
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      accessibilityLabel={label}
      style={{ flex }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      decelerationRate="fast"
      snapToInterval={WHEEL_ITEM_HEIGHT}
      snapToAlignment="start"
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: initialIndex * WHEEL_ITEM_HEIGHT }}
      onScroll={scrollHandler}
      onContentSizeChange={handleContentSizeChange}
      onMomentumScrollEnd={settleAt}
      onScrollEndDrag={handleDragEnd}
    >
      <View style={{ height: WHEEL_SPACER_HEIGHT }} />
      {items.map((item, index) => (
        <WheelItem
          key={item}
          label={item}
          index={index}
          scrollY={scrollY}
          isDimmed={index >= firstDimmedIndex}
          align={align}
          onPress={handlePressItem}
        />
      ))}
      <View style={{ height: WHEEL_SPACER_HEIGHT }} />
    </Animated.ScrollView>
  );
}
