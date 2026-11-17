import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon-paths";
import { QrCode } from "@/components/ui/qr-code";
import { Text } from "@/components/ui/text";
import {
  QR_CHECKS,
  VERIFY_STEP_MS,
  qrOutcome,
  type QrKey,
  type QrOutcome,
} from "@/features/send/send-logic";
import { startSend } from "@/features/send/start-send";
import { cn } from "@/lib/cn";
import { toast } from "@/stores/toast-store";
import { colors } from "@/theme/colors";

import { ScanSheet, type ScanLook } from "./scan-sheet";

const TOP_EXTRA_PADDING = 8;
const BOTTOM_MIN_PADDING = 30;
const BOTTOM_INSET_PADDING = 12;
const BACK_HIT_SLOP = 2;
const REDUCED_STEP_MS = 60;
const FINAL_BEAT_RATIO = 0.8;
// Lets the result sheet slide away before the next screen is pushed over it.
const SHEET_CLOSE_MS = 320;

const FRAME_SIZE = 252;
const FRAME_RADIUS = 26;
const BRACKET_SIZE = 44;
const BRACKET_WIDTH = 4;
const LINE_INSET = 18;
const LINE_TRAVEL = FRAME_SIZE - 20 - LINE_INSET;
const LINE_HALF_CYCLE_MS = 1200;
const MINI_INSET = 46;
const MINI_PADDING = 9;
const MINI_SIZE = FRAME_SIZE - MINI_INSET * 2;
const MINI_POP_MS = 300;
const MINI_START_SCALE = 0.7;
const SUN_CLEAR = "rgba(255,212,0,0)";
const TOOL_CIRCLE_BG = "rgba(255,255,255,0.1)";
const CHIP_BG = colors["surface-2"];

const DEMO_CODES: readonly { key: QrKey; label: string }[] = [
  { key: "maria", label: "Philippines account" },
  { key: "expired", label: "Expired" },
  { key: "self", label: "Your own" },
  { key: "bad", label: "Not MoriCash" },
];

type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_STYLES: Record<Corner, ViewStyle> = {
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: BRACKET_WIDTH,
    borderLeftWidth: BRACKET_WIDTH,
    borderTopLeftRadius: FRAME_RADIUS,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: BRACKET_WIDTH,
    borderRightWidth: BRACKET_WIDTH,
    borderTopRightRadius: FRAME_RADIUS,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BRACKET_WIDTH,
    borderLeftWidth: BRACKET_WIDTH,
    borderBottomLeftRadius: FRAME_RADIUS,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BRACKET_WIDTH,
    borderRightWidth: BRACKET_WIDTH,
    borderBottomRightRadius: FRAME_RADIUS,
  },
};

const CORNERS = Object.keys(CORNER_STYLES) as Corner[];

/** Scan state machine: one verification check per beat, timers always cleaned up. */
function useScanSession() {
  const isReduced = useReducedMotion();
  const [res, setRes] = useState<QrOutcome | null>(null);
  const [look, setLook] = useState<ScanLook>("idle");
  const [vstep, setVstep] = useState(0);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    if (look !== "verifying" || res === null) return;
    const stop = res.failAt >= 0 ? res.failAt : QR_CHECKS.length;
    const isLastBeat = vstep >= stop;
    const delay = isReduced
      ? REDUCED_STEP_MS
      : isLastBeat
        ? VERIFY_STEP_MS * FINAL_BEAT_RATIO
        : VERIFY_STEP_MS;
    const timer = setTimeout(() => {
      if (!isLastBeat) setVstep(vstep + 1);
      else setLook(res.failAt >= 0 ? "bad" : "found");
    }, delay);
    return () => clearTimeout(timer);
  }, [look, res, vstep, isReduced]);

  const verify = (key: QrKey) => {
    setRes(qrOutcome(key));
    setLook("verifying");
    setVstep(0);
  };
  const reset = () => {
    setRes(null);
    setLook("idle");
    setVstep(0);
  };
  const toggleTorch = () => setTorch((isOn) => !isOn);

  return { res, look, vstep, torch, verify, reset, toggleTorch };
}

type HeaderProps = {
  torch: boolean;
  onClose: () => void;
  onToggleTorch: () => void;
};

function ScanHeader({ torch, onClose, onToggleTorch }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={BACK_HIT_SLOP}
        onPress={onClose}
        className="h-10 w-10 items-center justify-center rounded-[12px]"
      >
        <Icon name="x" />
      </Pressable>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 text-center font-text-semibold text-[16px]"
      >
        Scan a MoriCash code
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Flashlight"
        accessibilityState={{ selected: torch }}
        hitSlop={BACK_HIT_SLOP}
        onPress={onToggleTorch}
        className={cn(
          "h-10 w-10 items-center justify-center rounded-[12px]",
          torch && "bg-sun",
        )}
      >
        <Icon name="bolt" size={20} color={torch ? colors["on-sun"] : colors.ink} />
      </Pressable>
    </View>
  );
}

function Bracket({ corner, color }: { corner: Corner; color: string }) {
  const style: StyleProp<ViewStyle> = [
    {
      position: "absolute",
      width: BRACKET_SIZE,
      height: BRACKET_SIZE,
      borderColor: color,
    },
    CORNER_STYLES[corner],
  ];
  return <View style={style} />;
}

function ScanLine() {
  const isReduced = useReducedMotion();
  const offset = useSharedValue(isReduced ? LINE_TRAVEL / 2 : 0);

  useEffect(() => {
    if (isReduced) return;
    offset.set(
      withRepeat(
        withTiming(LINE_TRAVEL, {
          duration: LINE_HALF_CYCLE_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(offset);
  }, [isReduced, offset]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: LINE_INSET,
          right: LINE_INSET,
          top: LINE_INSET,
          height: 2,
          boxShadow: "0 0 14px 3px rgba(255,212,0,0.45)",
        },
        lineStyle,
      ]}
    >
      <LinearGradient
        colors={[SUN_CLEAR, colors.sun, SUN_CLEAR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

function QrMini({ seed }: { seed: string }) {
  const isReduced = useReducedMotion();
  const progress = useSharedValue(isReduced ? 1 : 0);

  useEffect(() => {
    if (isReduced) return;
    progress.set(
      withTiming(1, { duration: MINI_POP_MS, easing: Easing.out(Easing.ease) }),
    );
  }, [isReduced, progress]);

  const popStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [
      { rotate: "-5deg" },
      { scale: MINI_START_SCALE + (1 - MINI_START_SCALE) * progress.get() },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: MINI_INSET,
          left: MINI_INSET,
          width: MINI_SIZE,
          height: MINI_SIZE,
          padding: MINI_PADDING,
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 12px 30px rgba(0,0,0,0.55)",
        },
        popStyle,
      ]}
    >
      <QrCode seed={seed} size={MINI_SIZE - MINI_PADDING * 2} />
    </Animated.View>
  );
}

function Viewfinder({ res, look }: { res: QrOutcome | null; look: ScanLook }) {
  const bracketColor =
    look === "bad" ? colors.neg : res !== null ? colors.pos : colors.sun;

  return (
    <View
      accessible
      accessibilityLabel={
        res ? "QR code detected" : "Camera viewfinder. Point at a MoriCash code."
      }
      className="mt-[30px] self-center"
      style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
    >
      <View
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: FRAME_RADIUS }}
      >
        <LinearGradient
          colors={["#2D3139", "#111317"]}
          start={{ x: 0.3, y: 0.1 }}
          end={{ x: 0.8, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {CORNERS.map((corner) => (
          <Bracket key={corner} corner={corner} color={bracketColor} />
        ))}
        {res ? <QrMini key={res.key} seed={`scan${res.key}`} /> : <ScanLine />}
      </View>
    </View>
  );
}

type ToolProps = { icon: IconName; label: string; onPress: () => void };

function QTool({ icon, label, onPress }: ToolProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="items-center gap-[6px]"
    >
      <View
        className="h-[52px] w-[52px] items-center justify-center rounded-full"
        style={{ backgroundColor: TOOL_CIRCLE_BG }}
      >
        <Icon name={icon} size={20} />
      </View>
      <Text className="font-text-medium text-[12.5px]">{label}</Text>
    </Pressable>
  );
}

function DemoChips({ onPick }: { onPick: (key: QrKey) => void }) {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-[6px]">
      <Text className="w-full text-center text-[12px] leading-[17px] text-ink-2">
        Try other codes:
      </Text>
      {DEMO_CODES.map(({ key, label }) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={`Try code: ${label}`}
          onPress={() => onPick(key)}
          className="h-[30px] justify-center rounded-[15px] px-[10px]"
          style={{ backgroundColor: CHIP_BG }}
        >
          <Text className="font-text-medium text-[12.5px]">{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useScanSession();
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (navTimer.current) clearTimeout(navTimer.current);
    },
    [],
  );

  const handleEnterAmount = () => {
    const to = session.res?.to;
    if (!to) return;
    session.reset();
    navTimer.current = setTimeout(
      () => startSend(router, { to, via: "qr" }),
      SHEET_CLOSE_MS,
    );
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + TOP_EXTRA_PADDING }}
    >
      <ScanHeader
        torch={session.torch}
        onClose={() => router.back()}
        onToggleTorch={session.toggleTorch}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow px-5"
        contentContainerStyle={{
          paddingBottom: Math.max(
            insets.bottom + BOTTOM_INSET_PADDING,
            BOTTOM_MIN_PADDING,
          ),
        }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <Viewfinder res={session.res} look={session.look} />
        <Text className="mx-[10px] mt-[26px] text-center text-[15px] leading-[22.5px] text-ink-2">
          Hold the phone steady with the code inside the frame, then tap Verify.
        </Text>
        <View className="mt-[18px] flex-row justify-center gap-8">
          <QTool
            icon="image"
            label="From photos"
            onPress={() => toast("Not part of this prototype yet")}
          />
          <QTool
            icon="qr"
            label="My code"
            onPress={() => router.push("/receive")}
          />
        </View>
        <View className="mt-auto gap-3 pt-5">
          <Button
            label="Verify QR code"
            icon="shield"
            onPress={() => session.verify("yuki")}
          />
          <DemoChips onPick={session.verify} />
        </View>
      </ScrollView>
      <ScanSheet
        res={session.res}
        look={session.look}
        vstep={session.vstep}
        onEnterAmount={handleEnterAmount}
        onScanAgain={session.reset}
      />
    </View>
  );
}
