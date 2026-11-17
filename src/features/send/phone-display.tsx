import { useEffect } from "react";
import { Pressable, View, type TextStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { COUNTRY_CODES, formatPhone, type CountryCode } from "@/lib/phone";
import { colors } from "@/theme/colors";

const CARET_HALF_CYCLE_MS = 500;
const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };
const ISO_TRACKING: TextStyle = { letterSpacing: 0.84 };

export type PhoneBoxTone = "idle" | "bad" | "ok";

const BOX_BORDER: Record<PhoneBoxTone, string> = {
  idle: "border-ink",
  bad: "border-neg",
  ok: "border-pos",
};

/** Hard blink (on/off, no fade) like the prototype's `steps(1)` caret. */
function Caret({ hasValue }: { hasValue: boolean }) {
  const isReduced = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isReduced) {
      opacity.set(1);
      return;
    }
    opacity.set(
      withRepeat(
        withSequence(
          withDelay(CARET_HALF_CYCLE_MS, withTiming(0, { duration: 0 })),
          withDelay(CARET_HALF_CYCLE_MS, withTiming(1, { duration: 0 })),
        ),
        -1,
      ),
    );
  }, [isReduced, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      aria-hidden
      className={cn(
        "h-[26px] w-[2px] rounded-[1px] bg-ink",
        hasValue ? "ml-[2px]" : "mr-[3px]",
      )}
      style={style}
    />
  );
}

type CountryChipProps = { cc: CountryCode; onPress: () => void };

function CountryChip({ cc, onPress }: CountryChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Country code ${cc}, tap to change`}
      onPress={onPress}
      className="h-[46px] flex-row items-center gap-[6px] rounded-[12px] bg-surface-2 pl-3 pr-[10px] active:opacity-80"
    >
      <Text
        className="font-text-bold text-[10.5px] text-ink-3"
        style={ISO_TRACKING}
      >
        {COUNTRY_CODES[cc].iso}
      </Text>
      <Text
        className="font-text-semibold text-[16px]"
        style={TABULAR_NUMS}
      >
        {cc}
      </Text>
      <Icon name="chevD" size={14} strokeWidth={2.2} />
    </Pressable>
  );
}

type PhoneEntryBoxProps = {
  cc: CountryCode;
  num: string;
  tone: PhoneBoxTone;
  onCountryPress: () => void;
  onClear: () => void;
};

/** Rounded entry box: country chip, big live-formatted number, clear button. */
export function PhoneEntryBox({
  cc,
  num,
  tone,
  onCountryPress,
  onClear,
}: PhoneEntryBoxProps) {
  const hasValue = num.length > 0;

  return (
    <View
      className={cn(
        "flex-row items-center gap-[10px] rounded-[18px] border-[1.5px] bg-surface p-2",
        BOX_BORDER[tone],
      )}
    >
      <CountryChip cc={cc} onPress={onCountryPress} />
      <View
        accessibilityLiveRegion="polite"
        className="min-w-0 flex-1 flex-row items-center overflow-hidden"
      >
        {hasValue ? null : <Caret hasValue={false} />}
        <Text
          numberOfLines={1}
          className={cn(
            "text-[25px] tracking-[-0.125px]",
            hasValue ? "font-display" : "font-display-medium text-ink-3",
          )}
          style={TABULAR_NUMS}
        >
          {hasValue ? formatPhone(cc, num) : COUNTRY_CODES[cc].example}
        </Text>
        {hasValue ? <Caret hasValue /> : null}
      </View>
      {hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear number"
          onPress={onClear}
          className="h-[32px] w-[32px] items-center justify-center rounded-[10px] active:bg-surface-2"
        >
          <Icon name="x" size={16} strokeWidth={2.2} color={colors["ink-2"]} />
        </Pressable>
      ) : null}
    </View>
  );
}

type DigitMeterProps = {
  count: number;
  total: number;
  isFull: boolean;
  hasLeadingZero: boolean;
};

/** Row of small bars (one per digit) plus the "n of 10 digits" caption. */
export function DigitMeter({
  count,
  total,
  isFull,
  hasLeadingZero,
}: DigitMeterProps) {
  const bars = Array.from({ length: total }, (_, index) => index);

  return (
    <View className="flex-row items-center justify-between px-1 pt-[10px]">
      <View
        accessible
        accessibilityLabel={`${count} of ${total} digits`}
        className="flex-row gap-[3px]"
      >
        {bars.map((index) => (
          <View
            key={index}
            className={cn(
              "h-1 w-3 rounded-[2px]",
              index < count ? (isFull ? "bg-pos" : "bg-ink") : "bg-line",
            )}
          />
        ))}
      </View>
      <Text className="text-[12.5px] text-ink-3" style={TABULAR_NUMS}>
        {hasLeadingZero ? "No need for the first 0" : `${count} of ${total} digits`}
      </Text>
    </View>
  );
}
