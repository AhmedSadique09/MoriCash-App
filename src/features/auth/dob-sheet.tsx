import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { colors } from "@/theme/colors";

import {
  WHEEL_ITEM_HEIGHT,
  WHEEL_SPACER_HEIGHT,
  WHEEL_VIEWPORT_HEIGHT,
  WheelColumn,
  type WheelHandle,
} from "./wheel-column";

type Dob = { d: number; m: number; y: number };
type WheelKey = keyof Dob;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MIN_AGE = 18;
const YEAR_SPAN = 100;
const DEFAULT_DOB: Dob = { d: 1, m: 0, y: 1995 };
const DOB_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Selectable range, worked out from today's date each time the sheet opens. */
type DobLimits = { minYear: number; max: Dob };

const DAY_LABELS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const WHEEL_KEYS: readonly WheelKey[] = ["m", "d", "y"];

const SCRIM_COLOR = "rgba(0, 0, 0, 0.4)";
const SCRIM_FADE_MS = 200;
const SLIDE_MS = 320;
const SLIDE_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);
/** Used until the sheet reports its real height, so it starts fully off-screen. */
const SLIDE_FALLBACK_DISTANCE = 400;
const SHEET_RADIUS = 16;
const SHEET_BOTTOM_PADDING = 34;
const BAR_HEIGHT = 52;
const FADE_FRACTION = 0.28;
const FADE_HEIGHT = WHEEL_VIEWPORT_HEIGHT * FADE_FRACTION;
// Same RGB as the surface so the fade never passes through a gray fringe.
const SURFACE_CLEAR = `${colors.surface}00`;
const FADE_DOWN_COLORS = [colors.surface, SURFACE_CLEAR] as const;
const FADE_UP_COLORS = [SURFACE_CLEAR, colors.surface] as const;

const SHEET_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: -10 },
  shadowOpacity: 0.18,
  shadowRadius: 15,
} as const;

const styles = StyleSheet.create({
  fade: { position: "absolute", left: 0, right: 0, height: FADE_HEIGHT, pointerEvents: "none" },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    top: WHEEL_SPACER_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 9,
    backgroundColor: colors["surface-2"],
    pointerEvents: "none",
  },
});

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * The latest selectable date is exactly 18 years before `today` (29 Feb falls
 * back to 28 Feb when that year has no leap day); years run 100 back from it.
 */
function dobLimits(today: Date): DobLimits {
  const y = today.getFullYear() - MIN_AGE;
  const m = today.getMonth();
  return { minYear: y - YEAR_SPAN, max: { y, m, d: Math.min(today.getDate(), daysInMonth(y, m)) } };
}

const yearLabels = ({ minYear, max }: DobLimits): string[] =>
  Array.from({ length: max.y - minYear + 1 }, (_, i) => String(minYear + i));

/** Row index = value - offset (months 0-based, days 1-based, years start at `minYear`). */
const indexOffset = (key: WheelKey, minYear: number): number =>
  ({ m: 0, d: 1, y: minYear })[key];

const dobKey = ({ y, m, d }: Dob): number => y * 10000 + m * 100 + d;

/** Clamps the day to the month length, then the whole date to `limits.max`. */
function clampDob(dob: Dob, { max }: DobLimits): Dob {
  const clamped = { ...dob, d: Math.min(dob.d, daysInMonth(dob.y, dob.m)) };
  if (dobKey(clamped) <= dobKey(max)) return clamped;
  return { y: max.y, m: Math.min(clamped.m, max.m), d: Math.min(clamped.d, max.d) };
}

function parseDob(value: string, limits: DobLimits): Dob {
  const match = DOB_PATTERN.exec(value);
  if (!match) return clampDob(DEFAULT_DOB, limits);
  return clampDob(
    {
      d: Math.max(1, Number(match[1])),
      m: Math.min(11, Math.max(0, Number(match[2]) - 1)),
      y: Math.min(limits.max.y, Math.max(limits.minYear, Number(match[3]))),
    },
    limits,
  );
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

const formatDob = ({ d, m, y }: Dob): string => `${pad2(d)}/${pad2(m + 1)}/${y}`;

const indexOf = (key: WheelKey, dob: Dob, minYear: number): number =>
  dob[key] - indexOffset(key, minYear);

function useSheetSlide() {
  const scrimOpacity = useSharedValue(0);
  const slide = useSharedValue(0);
  const sheetHeight = useSharedValue(SLIDE_FALLBACK_DISTANCE);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      scrimOpacity.set(1);
      slide.set(1);
      return;
    }
    scrimOpacity.set(withTiming(1, { duration: SCRIM_FADE_MS, easing: Easing.out(Easing.ease) }));
    slide.set(withTiming(1, { duration: SLIDE_MS, easing: SLIDE_EASING }));
  }, [reducedMotion, scrimOpacity, slide]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.get() }));
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - slide.get()) * sheetHeight.get() }],
  }));
  const handleSheetLayout = (event: LayoutChangeEvent) => {
    sheetHeight.set(event.nativeEvent.layout.height);
  };

  return { scrimStyle, slideStyle, handleSheetLayout };
}

type SheetBarProps = { onCancel: () => void; onDone: () => void };

function SheetBar({ onCancel, onDone }: SheetBarProps) {
  return (
    <View
      className="flex-row items-center border-b border-line px-4"
      style={{ height: BAR_HEIGHT }}
    >
      <View className="flex-1 items-start">
        <Pressable
          accessibilityRole="button"
          className="py-2 active:opacity-60"
          hitSlop={8}
          onPress={onCancel}
        >
          <Text className="text-[16px] text-sky">Cancel</Text>
        </Pressable>
      </View>
      <Text accessibilityRole="header" className="font-text-semibold text-[16px]">
        Date of birth
      </Text>
      <View className="flex-1 items-end">
        <Pressable
          accessibilityRole="button"
          className="py-2 active:opacity-60"
          hitSlop={8}
          onPress={onDone}
        >
          <Text className="font-text-semibold text-[16px] text-sky">Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

type WheelsProps = {
  initial: Dob;
  draft: Dob;
  minYear: number;
  years: readonly string[];
  onSettle: (key: WheelKey, index: number) => void;
  monthRef: RefObject<WheelHandle | null>;
  dayRef: RefObject<WheelHandle | null>;
  yearRef: RefObject<WheelHandle | null>;
};

function Wheels({
  initial,
  draft,
  minYear,
  years,
  onSettle,
  monthRef,
  dayRef,
  yearRef,
}: WheelsProps) {
  return (
    <View
      className="mx-[10px] mt-3 flex-row"
      style={{ height: WHEEL_VIEWPORT_HEIGHT }}
    >
      <View style={styles.band} />
      <WheelColumn
        ref={monthRef}
        label="Month"
        items={MONTHS}
        initialIndex={indexOf("m", initial, minYear)}
        align="right"
        flex={1.55}
        onSettle={(index) => onSettle("m", index)}
      />
      <WheelColumn
        ref={dayRef}
        label="Day"
        items={DAY_LABELS}
        initialIndex={indexOf("d", initial, minYear)}
        firstDimmedIndex={daysInMonth(draft.y, draft.m)}
        align="center"
        flex={0.75}
        onSettle={(index) => onSettle("d", index)}
      />
      <WheelColumn
        ref={yearRef}
        label="Year"
        items={years}
        initialIndex={indexOf("y", initial, minYear)}
        align="left"
        flex={1}
        onSettle={(index) => onSettle("y", index)}
      />
      <LinearGradient colors={FADE_DOWN_COLORS} style={[styles.fade, { top: 0 }]} />
      <LinearGradient colors={FADE_UP_COLORS} style={[styles.fade, { bottom: 0 }]} />
    </View>
  );
}

type BodyProps = {
  value: string;
  onCancel: () => void;
  onDone: (value: string) => void;
};

function DobSheetBody({ value, onCancel, onDone }: BodyProps) {
  // Frozen per open: the range comes from today's date and must not shift under the wheels.
  const [setup] = useState(() => {
    const limits = dobLimits(new Date());
    return { limits, years: yearLabels(limits), initial: parseDob(value, limits) };
  });
  const { limits, years, initial } = setup;
  const [draft, setDraft] = useState(initial);
  const monthRef = useRef<WheelHandle>(null);
  const dayRef = useRef<WheelHandle>(null);
  const yearRef = useRef<WheelHandle>(null);
  const wheelRefs = { m: monthRef, d: dayRef, y: yearRef };
  const { bottom: safeBottom } = useSafeAreaInsets();
  const { scrimStyle, slideStyle, handleSheetLayout } = useSheetSlide();

  const handleSettle = (key: WheelKey, index: number) => {
    const requested = { ...draft, [key]: index + indexOffset(key, limits.minYear) };
    const next = clampDob(requested, limits);
    setDraft(next);
    for (const wheelKey of WHEEL_KEYS) {
      if (next[wheelKey] !== requested[wheelKey]) {
        wheelRefs[wheelKey].current?.scrollToIndex(indexOf(wheelKey, next, limits.minYear));
      }
    }
  };

  return (
    <View className="flex-1 justify-end">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM_COLOR }, scrimStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close date picker"
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        accessibilityLabel="Date of birth"
        onLayout={handleSheetLayout}
        style={[
          {
            backgroundColor: colors.surface,
            borderTopLeftRadius: SHEET_RADIUS,
            borderTopRightRadius: SHEET_RADIUS,
            paddingBottom: Math.max(SHEET_BOTTOM_PADDING, safeBottom),
          },
          SHEET_SHADOW,
          slideStyle,
        ]}
      >
        <SheetBar onCancel={onCancel} onDone={() => onDone(formatDob(clampDob(draft, limits)))} />
        <Wheels
          initial={initial}
          draft={draft}
          minYear={limits.minYear}
          years={years}
          onSettle={handleSettle}
          monthRef={monthRef}
          dayRef={dayRef}
          yearRef={yearRef}
        />
        <Text className="mt-[10px] text-center text-[12.5px] text-ink-3">
          You need to be 18 or older to use MoriCash.
        </Text>
      </Animated.View>
    </View>
  );
}

type Props = {
  visible: boolean;
  /** `DD/MM/YYYY`; an empty or invalid string opens on 1 Jan 1995. */
  value: string;
  onCancel: () => void;
  onDone: (value: string) => void;
};

export function DobSheet({ visible, value, onCancel, onDone }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Mounted per open so the draft restarts from `value` each time. */}
      {visible ? <DobSheetBody value={value} onCancel={onCancel} onDone={onDone} /> : null}
    </Modal>
  );
}
