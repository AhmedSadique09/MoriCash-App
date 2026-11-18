import { useEffect } from "react";
import { View, type TextStyle } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Coin } from "@/components/ui/coin";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { fullPhone } from "@/lib/phone";
import { colors } from "@/theme/colors";

import { personInitials, personName, type Person } from "./people";
import { REVIEW_ITEMS } from "./send-logic";
import type { TrackPhase } from "./use-transfer-pipeline";

const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };

const AVATAR_SIZE = 68;
const LANE_WIDTH = 110;
const MARKER_BOX = 46;
const MARKER_SIZE = 38;
const COIN_SIZE = 30;
const COIN_RING = 3;
const DASH_LENGTH = 6;
const DASH_GAP = 5;
const DASH_PERIOD = DASH_LENGTH + DASH_GAP;
const DASH_COUNT = Math.ceil(LANE_WIDTH / DASH_PERIOD) + 2;
const DASH_SHIFT_MS = 300;
const TRAVEL_X = 58;
const TRAVEL_MS = 1100;
const PING_MS = 1400;
const PING_SCALE_GAIN = 0.7;
const PING_START_OPACITY = 0.8;
const DOT_COUNT = 3;
const DOT_STAGGER_MS = 200;
const DOT_PULSE_MS = 600;
const PROGRESS_MS = 800;
const REVIEW_BASE_PCT = 10;
const REVIEW_SPAN_PCT = 48;
const TX_PCT = 92;
const BAD_PCT = 66;

const TITLES: Record<TrackPhase, string> = {
  rev: "Reviewing your transfer",
  tx: "Transferring",
  ok: "Sent",
  bad: "Transfer stopped",
};

function subtitleFor(
  phase: TrackPhase,
  recipient: Person,
  amount: number,
  failure: string | null,
): string {
  switch (phase) {
    case "rev":
      return "A few quick checks before anything moves.";
    case "tx":
      return `Sending ${fmt(amount)} USDT to ${recipient.first}.`;
    case "ok":
      return `To ${personName(recipient)} · ${fullPhone(recipient.cc, recipient.num)}`;
    case "bad":
      return failure ?? "Nothing was taken from your balance.";
  }
}

export function progressPercent(phase: TrackPhase, sub: number): number {
  if (phase === "ok") return 100;
  if (phase === "bad") return BAD_PCT;
  if (phase === "tx") return TX_PCT;
  return Math.round(REVIEW_BASE_PCT + (sub / REVIEW_ITEMS.length) * REVIEW_SPAN_PCT);
}

function LaneDashes({ phase }: { phase: TrackPhase }) {
  const isReduced = useReducedMotion();
  const shift = useSharedValue(0);
  const isMoving = phase === "tx" && !isReduced;

  useEffect(() => {
    if (!isMoving) {
      shift.set(0);
      return;
    }
    shift.set(
      withRepeat(
        withTiming(DASH_PERIOD, { duration: DASH_SHIFT_MS, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(shift);
  }, [isMoving, shift]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.get() }],
  }));

  if (phase === "ok") {
    return <View className="absolute top-[22px] h-[2px] w-full bg-pos" />;
  }

  const isTransfer = phase === "tx";
  return (
    <View
      className="absolute top-[22px] h-[2px] overflow-hidden"
      style={{ width: LANE_WIDTH, opacity: isTransfer ? 0.9 : 0.6 }}
    >
      <Animated.View
        style={[
          { position: "absolute", left: -DASH_PERIOD, flexDirection: "row", gap: DASH_GAP },
          rowStyle,
        ]}
      >
        {Array.from({ length: DASH_COUNT }, (_, index) => (
          <View
            key={index}
            style={{
              width: DASH_LENGTH,
              height: 2,
              backgroundColor: isTransfer ? colors.pos : colors["ink-3"],
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function LaneMarker({ phase }: { phase: TrackPhase }) {
  const isReduced = useReducedMotion();
  const ping = useSharedValue(0);
  const travel = useSharedValue(0);

  useEffect(() => {
    if (isReduced) return;
    if (phase === "rev") {
      ping.set(
        withRepeat(withTiming(1, { duration: PING_MS, easing: Easing.out(Easing.ease) }), -1, false),
      );
      return () => cancelAnimation(ping);
    }
    if (phase === "tx") {
      travel.set(
        withRepeat(
          withTiming(1, { duration: TRAVEL_MS, easing: Easing.bezier(0.45, 0, 0.55, 1) }),
          -1,
          false,
        ),
      );
      return () => cancelAnimation(travel);
    }
  }, [phase, isReduced, ping, travel]);

  const pingStyle = useAnimatedStyle(() => ({
    opacity: PING_START_OPACITY * (1 - ping.get()),
    transform: [{ scale: 1 + PING_SCALE_GAIN * ping.get() }],
  }));
  const coinStyle = useAnimatedStyle(() => {
    const progress = travel.get();
    return {
      opacity: interpolate(progress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: interpolate(progress, [0, 1], [-TRAVEL_X, TRAVEL_X]) },
        { scale: 0.8 },
      ],
    };
  });

  if (phase === "tx") {
    return (
      <Animated.View
        style={[
          {
            borderRadius: (COIN_SIZE + COIN_RING * 2) / 2,
            borderWidth: COIN_RING,
            borderColor: colors.surface,
          },
          isReduced ? undefined : coinStyle,
        ]}
      >
        <Coin asset="usdt" size={COIN_SIZE} />
      </Animated.View>
    );
  }

  const tone = phase === "ok" ? "bg-pos" : phase === "bad" ? "bg-neg" : "bg-sun";
  return (
    <View
      className="items-center justify-center rounded-full bg-surface"
      style={{ width: MARKER_BOX, height: MARKER_BOX }}
    >
      {phase === "rev" ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              width: MARKER_BOX,
              height: MARKER_BOX,
              borderRadius: MARKER_BOX / 2,
              borderWidth: 2,
              borderColor: colors.sun,
            },
            pingStyle,
          ]}
        />
      ) : null}
      <View
        className={cn("items-center justify-center rounded-full", tone)}
        style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
      >
        {phase === "rev" ? (
          <Icon name="shield" size={16} strokeWidth={2.2} color={colors["on-sun"]} />
        ) : (
          <Icon
            name={phase === "ok" ? "check" : "x"}
            size={16}
            strokeWidth={3}
            color="#FFFFFF"
          />
        )}
      </View>
    </View>
  );
}

type LaneProps = { phase: TrackPhase; meInitials: string; recipient: Person };

function Lane({ phase, meInitials, recipient }: LaneProps) {
  return (
    <View className="flex-row items-center justify-center">
      <PersonAvatar initials={meInitials} size={AVATAR_SIZE} tone="me" />
      <View
        className="mx-1 items-center justify-center"
        style={{ width: LANE_WIDTH, height: MARKER_BOX }}
      >
        <LaneDashes phase={phase} />
        <LaneMarker phase={phase} />
      </View>
      <PersonAvatar
        initials={personInitials(recipient)}
        size={AVATAR_SIZE}
      />
    </View>
  );
}

function BlinkDot({ delay }: { delay: number }) {
  const isReduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (isReduced) return;
    pulse.set(
      withDelay(delay, withRepeat(withTiming(1, { duration: DOT_PULSE_MS }), -1, true)),
    );
    return () => cancelAnimation(pulse);
  }, [isReduced, delay, pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + 0.8 * pulse.get(),
    transform: [{ scale: 0.8 + 0.2 * pulse.get() }],
  }));

  return (
    <Animated.View
      style={[
        { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.ink },
        isReduced ? { opacity: 0.6 } : dotStyle,
      ]}
    />
  );
}

function BlinkDots() {
  return (
    <View aria-hidden className="ml-1 mt-[10px] flex-row gap-[3px]">
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <BlinkDot key={index} delay={index * DOT_STAGGER_MS} />
      ))}
    </View>
  );
}

type ReviewStatus = "ok" | "now" | "wait";

function reviewStatus(index: number, sub: number): ReviewStatus {
  if (index < sub) return "ok";
  return index === sub ? "now" : "wait";
}

function ReviewState({ status }: { status: ReviewStatus }) {
  if (status === "now") return <Spinner size={16} />;
  if (status === "wait") {
    return <Text className="font-text-medium text-[12.5px] text-ink-3">Waiting</Text>;
  }
  return (
    <View className="flex-row items-center gap-1">
      <Icon name="check" size={12} strokeWidth={3} color={colors.pos} />
      <Text className="font-text-semibold text-[12.5px] text-pos">Passed</Text>
    </View>
  );
}

function ReviewRow({ index, sub }: { index: number; sub: number }) {
  const item = REVIEW_ITEMS[index];
  const status = reviewStatus(index, sub);
  const isActive = status !== "wait";
  const isLast = index === REVIEW_ITEMS.length - 1;
  const boxTone =
    status === "ok" ? "bg-pos-soft" : status === "now" ? "bg-sun-soft" : "bg-surface-2";
  const iconColor =
    status === "ok" ? colors.pos : status === "now" ? colors.ink : colors["ink-3"];

  return (
    <View
      className={cn(
        "flex-row items-center gap-[10px] py-[10px]",
        !isLast && "border-b border-line",
      )}
    >
      <View
        className={cn("h-[30px] w-[30px] items-center justify-center rounded-[10px]", boxTone)}
      >
        <Icon name={item.icon} size={16} strokeWidth={2} color={iconColor} />
      </View>
      <Text
        className={cn(
          "min-w-0 flex-1 font-text-medium text-[14px]",
          isActive ? "text-ink" : "text-ink-3",
        )}
      >
        {item.label}
      </Text>
      <ReviewState status={status} />
    </View>
  );
}

function ReviewChecklist({ sub }: { sub: number }) {
  return (
    <Animated.View
      exiting={FadeOut.duration(250)}
      style={{ alignSelf: "stretch", marginTop: 16 }}
    >
      <View className="rounded-[16px] bg-bg px-[14px] py-1">
        {REVIEW_ITEMS.map((item, index) => (
          <ReviewRow key={item.label} index={index} sub={sub} />
        ))}
      </View>
    </Animated.View>
  );
}

const FILL_COLORS: Record<TrackPhase, string> = {
  rev: colors.ink,
  tx: colors.ink,
  ok: colors.pos,
  bad: colors.neg,
};

function ProgressBar({ phase, sub }: { phase: TrackPhase; sub: number }) {
  const target = progressPercent(phase, sub);
  const width = useSharedValue(0);

  useEffect(() => {
    width.set(
      withTiming(target, { duration: PROGRESS_MS, easing: Easing.bezier(0.3, 0.7, 0.3, 1) }),
    );
  }, [target, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.get()}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: target }}
      className="mt-4 h-[6px] self-stretch overflow-hidden rounded-[3px] bg-surface-2"
    >
      <Animated.View
        style={[{ height: "100%", borderRadius: 3, backgroundColor: FILL_COLORS[phase] }, fillStyle]}
      />
    </View>
  );
}

type TransferCardProps = {
  phase: TrackPhase;
  sub: number;
  meInitials: string;
  recipient: Person;
  amount: number;
  /** The server's reason when it refused the transfer. */
  failure?: string | null;
};

/** The tracker card: you -> them lane, amount, state, review checks, progress. */
export function TransferCard({
  phase,
  sub,
  meInitials,
  recipient,
  amount,
  failure = null,
}: TransferCardProps) {
  const isBusy = phase === "rev" || phase === "tx";

  return (
    <View className="mt-[6px] items-center overflow-hidden rounded-[26px] border border-line bg-surface px-[18px] pb-[18px] pt-[26px]">
      <Lane phase={phase} meInitials={meInitials} recipient={recipient} />
      <Text
        className="mt-[14px] font-display text-[44px] leading-[48px] tracking-[-1.76px]"
        style={TABULAR_NUMS}
      >
        {fmt(amount)} <Text className="font-display text-[22px] text-ink-3">USDT</Text>
      </Text>
      <View className="mt-[10px] flex-row items-center justify-center gap-[2px]">
        <Text
          accessibilityRole="header"
          className={cn(
            "font-display text-[22px] tracking-[-0.44px]",
            phase === "ok" && "text-pos",
          )}
        >
          {TITLES[phase]}
        </Text>
        {isBusy ? <BlinkDots /> : null}
      </View>
      <Text className="mt-1 text-center text-[15px] leading-[22px] text-ink-2">
        {subtitleFor(phase, recipient, amount, failure)}
      </Text>
      {phase === "rev" ? <ReviewChecklist sub={sub} /> : null}
      <ProgressBar phase={phase} sub={sub} />
    </View>
  );
}
