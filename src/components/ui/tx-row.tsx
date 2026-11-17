import { useEffect, useState } from "react";
import { Pressable, View, type TextStyle, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { PEOPLE, personInitials, personName } from "@/features/send/people";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { HIGHLIGHT_MS, type Tx } from "@/stores/wallet-store";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";
import { PersonAvatar } from "./person-avatar";
import { Text } from "./text";

type TxRowProps = {
  tx: Tx;
  isHidden: boolean;
  onPress: (id: string) => void;
  isLast?: boolean;
};

const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };
const NEW_PILL_STYLE: ViewStyle = {
  height: 18,
  marginLeft: 8,
  paddingHorizontal: 6,
  justifyContent: "center",
  borderRadius: 9,
  backgroundColor: colors.sun,
};
const TX_ICONS: Record<Tx["type"], IconName> = {
  deposit: "plus",
  sent: "send",
  received: "down",
};
const AVATAR_SIZE = 42;
const BADGE_SIZE = 18;
const BADGE_RING = 2;
const HIDDEN_AMOUNT = "••••";
const TODAY_PREFIX = "Today · ";
// Prototype `@keyframes hlfade`: 0% -> 4% fade in, hold until 75%, fade out by 100%.
const FADE_STOPS = [0, 0.04, 0.75, 1];
const FADE_OPACITY = [0, 1, 1, 0];
const FRESH_HOLD_PROGRESS = 0.5;

function whenShort(whenLabel: string): string {
  return whenLabel.startsWith(TODAY_PREFIX)
    ? whenLabel.slice(TODAY_PREFIX.length)
    : (whenLabel.split(" · ")[0] ?? whenLabel);
}

function whenSpoken(whenLabel: string): string {
  return whenLabel
    .replace(" · ", " ")
    .replace(/^(Today|Yesterday)/, (word) => word.toLowerCase());
}

/** True while the "new" highlight should still show; drops itself when the window ends. */
function useFreshWindow(highlightedAt: number | undefined, isReduced: boolean) {
  const progress = useSharedValue(0);
  const [isFresh, setIsFresh] = useState(
    () => highlightedAt !== undefined && Date.now() - highlightedAt < HIGHLIGHT_MS,
  );

  useEffect(() => {
    if (!isFresh || highlightedAt === undefined) return;
    const remaining = Math.max(HIGHLIGHT_MS - (Date.now() - highlightedAt), 0);
    if (isReduced) {
      progress.set(FRESH_HOLD_PROGRESS);
    } else {
      progress.set(Math.min((HIGHLIGHT_MS - remaining) / HIGHLIGHT_MS, 1));
      progress.set(withTiming(1, { duration: remaining, easing: Easing.linear }));
    }
    const timer = setTimeout(() => setIsFresh(false), remaining);
    return () => {
      clearTimeout(timer);
      cancelAnimation(progress);
    };
  }, [highlightedAt, isFresh, isReduced, progress]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: isReduced
      ? 1
      : interpolate(progress.get(), FADE_STOPS, FADE_OPACITY),
  }));

  return { isFresh, fadeStyle };
}

function DirectionBadge({ type }: { type: "sent" | "received" }) {
  const isReceived = type === "received";

  return (
    <View
      className="absolute items-center justify-center rounded-full bg-surface"
      style={{
        right: -3 - BADGE_RING,
        bottom: -3 - BADGE_RING,
        width: BADGE_SIZE + BADGE_RING * 2,
        height: BADGE_SIZE + BADGE_RING * 2,
      }}
    >
      <View
        className={cn(
          "items-center justify-center rounded-full",
          isReceived ? "bg-pos" : "bg-ink",
        )}
        style={{ width: BADGE_SIZE, height: BADGE_SIZE }}
      >
        <View style={{ transform: [{ rotate: isReceived ? "135deg" : "-45deg" }] }}>
          <Icon
            name="arrowR"
            size={11}
            strokeWidth={2.8}
            color={isReceived ? "#FFFFFF" : colors.bg}
          />
        </View>
      </View>
    </View>
  );
}

function TxAvatar({ tx, personKey }: { tx: Tx; personKey: string | null }) {
  const person = personKey ? PEOPLE[personKey] : undefined;

  if (person && tx.type !== "deposit") {
    return (
      <View>
        <PersonAvatar initials={personInitials(person)} size={AVATAR_SIZE} />
        <DirectionBadge type={tx.type} />
      </View>
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-surface-2"
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
    >
      <Icon name={TX_ICONS[tx.type]} size={18} />
    </View>
  );
}

function buildLabel(tx: Tx, name: string, isHidden: boolean, hasPerson: boolean) {
  const amount = isHidden ? "amount hidden" : `${fmt(Math.abs(tx.amount))} USDT`;
  const when = whenSpoken(tx.whenLabel);
  const note = tx.note ? `. ${tx.note}` : "";
  if (!hasPerson) return `${name}, ${amount}, ${when}${note}`;
  const verb = tx.type === "sent" ? `Sent ${amount} to` : `Received ${amount} from`;
  return `${verb} ${name}, ${when}${note}`;
}

/** One activity row: avatar + direction badge, title, note, amount and time. */
export function TxRow({ tx, isHidden, onPress, isLast = false }: TxRowProps) {
  const isReduced = useReducedMotion();
  const { isFresh, fadeStyle } = useFreshWindow(tx.highlightedAt, isReduced);

  const isPositive = tx.amount > 0;
  const person = tx.whoKey ? PEOPLE[tx.whoKey] : undefined;
  const name = person ? personName(person) : tx.title;
  const secondLine = person
    ? tx.note || (tx.type === "sent" ? "Sent" : "Received")
    : (tx.sub ?? "");
  const amountText = isHidden
    ? HIDDEN_AMOUNT
    : `${isPositive ? "+" : "−"}${fmt(Math.abs(tx.amount))} USDT`;
  const label = buildLabel(tx, name, isHidden, Boolean(person));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isFresh ? `New. ${label}` : label}
      accessibilityHint="Opens transaction details"
      onPress={() => onPress(tx.id)}
      className={cn(
        "relative flex-row items-center gap-3 py-[14px] active:opacity-60",
        !isLast && "border-b border-line",
      )}
    >
      {isFresh ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 3,
              bottom: 3,
              left: -10,
              right: -10,
              borderRadius: 12,
              backgroundColor: colors["sun-soft"],
              borderLeftWidth: 3,
              borderLeftColor: colors.sun,
              pointerEvents: "none",
            },
            fadeStyle,
          ]}
        />
      ) : null}
      <TxAvatar tx={tx} personKey={tx.whoKey ?? null} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center">
          <Text numberOfLines={1} className="shrink font-text-semibold text-[15.5px]">
            {name}
          </Text>
          {isFresh ? (
            <Animated.View style={[NEW_PILL_STYLE, fadeStyle]}>
              <Text className="font-text-bold text-[10.5px] uppercase tracking-[0.42px] text-on-sun">
                New
              </Text>
            </Animated.View>
          ) : null}
        </View>
        <Text numberOfLines={1} className="mt-[2px] text-[13.5px] text-ink-3">
          {secondLine}
        </Text>
      </View>
      <View className="items-end gap-[2px]">
        <Text
          className={cn("font-text-semibold text-[15.5px]", isPositive && "text-pos")}
          style={TABULAR_NUMS}
        >
          {amountText}
        </Text>
        <Text className="text-[12px] text-ink-3">{whenShort(tx.whenLabel)}</Text>
      </View>
    </Pressable>
  );
}

/** Shown in place of the list when there are no transactions. */
export function EmptyActivity() {
  return (
    <View className="items-center py-[22px]">
      <Text className="font-text-semibold text-[15px]">No activity yet</Text>
      <Text className="mt-1 text-[12px] text-ink-3">
        Money you send and receive shows here.
      </Text>
    </View>
  );
}
