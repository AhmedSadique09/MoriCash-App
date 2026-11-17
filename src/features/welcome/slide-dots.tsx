import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/theme/colors";

const DOT_SIZE = 8;
const ACTIVE_WIDTH = 24;
const WIDTH_MS = 200;
const DOT_GAP = 6;
/**
 * 8px dots need ~18px above/below to reach a 44pt target. Sideways the slop
 * stops at half the gap so neighbouring dots never steal each other's taps.
 */
const DOT_HIT_SLOP = { top: 18, bottom: 18, left: DOT_GAP / 2, right: DOT_GAP / 2 };

type DotProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function Dot({ isActive, label, onPress }: DotProps) {
  const width = useSharedValue(isActive ? ACTIVE_WIDTH : DOT_SIZE);

  useEffect(() => {
    width.set(withTiming(isActive ? ACTIVE_WIDTH : DOT_SIZE, { duration: WIDTH_MS }));
  }, [isActive, width]);

  const animatedStyle = useAnimatedStyle(() => ({ width: width.get() }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      hitSlop={DOT_HIT_SLOP}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: isActive ? colors.ink : colors.line,
          },
          animatedStyle,
        ]}
      />
    </Pressable>
  );
}

type SlideDotsProps = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function SlideDots({ count, activeIndex, onSelect }: SlideDotsProps) {
  return (
    <View className="mt-[18px] flex-row gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <Dot
          key={index}
          isActive={index === activeIndex}
          label={`Slide ${index + 1}`}
          onPress={() => onSelect(index)}
        />
      ))}
    </View>
  );
}
