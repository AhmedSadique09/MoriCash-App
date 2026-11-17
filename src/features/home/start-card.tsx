import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon-paths";
import { Pill } from "@/components/ui/pill";
import { Text } from "@/components/ui/text";
import type { Tier } from "@/stores/onboarding-store";
import { colors } from "@/theme/colors";

const PULSE_HALF_MS = 800;
const PULSE_SCALE = 1.06;

type LeadCircleProps = { icon: IconName; isPulsing?: boolean };

/** 40px circle with an icon; gently pulses while a check is in progress. */
function LeadCircle({ icon, isPulsing = false }: LeadCircleProps) {
  const isReduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isPulsing || isReduced) return undefined;
    scale.set(
      withRepeat(
        withSequence(
          withTiming(PULSE_SCALE, {
            duration: PULSE_HALF_MS,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: PULSE_HALF_MS,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
      ),
    );
    return () => {
      cancelAnimation(scale);
      scale.set(1);
    };
  }, [isPulsing, isReduced, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View
      aria-hidden
      className="h-10 w-10 items-center justify-center rounded-full bg-surface-2"
      style={animatedStyle}
    >
      <Icon name={icon} size={20} />
    </Animated.View>
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <View className="mt-5 rounded-[20px] border border-line bg-surface p-[18px]">
      {children}
    </View>
  );
}

function VerifyCard({ onVerify }: { onVerify: () => void }) {
  return (
    <CardShell>
      <View className="flex-row items-center gap-3">
        <LeadCircle icon="shield" />
        <View className="flex-1">
          <Text className="font-text-semibold text-[17px]">
            Verify your identity
          </Text>
          <Text className="text-[12px] leading-[17px] text-ink-3">
            Needed before you can send money. About 3 minutes.
          </Text>
        </View>
      </View>
      <Button label="Verify now" onPress={onVerify} className="mt-4" />
    </CardShell>
  );
}

function CheckingCard() {
  return (
    <CardShell>
      <View className="flex-row items-center gap-3">
        <LeadCircle icon="clock" isPulsing />
        <View className="flex-1">
          <Text className="font-text-semibold text-[17px]">
            We&apos;re checking your ID
          </Text>
          <Text className="text-[12px] leading-[17px] text-ink-3">
            Usually under 5 minutes. You can send money once it&apos;s done.
          </Text>
        </View>
        <Pill label="In review" tone="warn" className="self-center" />
      </View>
    </CardShell>
  );
}

type WayProps = {
  icon: IconName;
  title: string;
  caption: string;
  onPress: () => void;
};

function Way({ icon, title, caption, onPress }: WayProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${caption}`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-[14px] bg-surface-2 py-[10px] pl-[10px] pr-3 active:opacity-70"
    >
      <View
        aria-hidden
        className="h-10 w-10 items-center justify-center rounded-xl bg-surface"
      >
        <Icon name={icon} size={20} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-text-semibold text-[15px]">{title}</Text>
        <Text className="text-[12px] leading-[17px] text-ink-3">{caption}</Text>
      </View>
      <Icon name="chevR" size={16} color={colors.ink} />
    </Pressable>
  );
}

type WaysCardProps = { onSendByPhone: () => void; onScan: () => void };

function WaysCard({ onSendByPhone, onScan }: WaysCardProps) {
  return (
    <CardShell>
      <Text className="font-text-semibold text-[17px]">Two ways to send</Text>
      <Text className="mt-1 text-[12px] leading-[17px] text-ink-3">
        We show you who you&apos;re paying before any money moves.
      </Text>
      <View className="mt-[14px] gap-2">
        <Way
          icon="phone"
          title="Mobile number"
          caption="Type the number, then verify it"
          onPress={onSendByPhone}
        />
        <Way
          icon="scan"
          title="QR code"
          caption="Scan their MoriCash code"
          onPress={onScan}
        />
      </View>
    </CardShell>
  );
}

type StartCardProps = {
  tier: Tier;
  hasSentTx: boolean;
  onVerify: () => void;
  onSendByPhone: () => void;
  onScan: () => void;
};

/** Contextual onboarding card: verify ID, ID in review, or how to send. */
export function StartCard({
  tier,
  hasSentTx,
  onVerify,
  onSendByPhone,
  onScan,
}: StartCardProps) {
  if (tier === 0) return <VerifyCard onVerify={onVerify} />;
  if (tier === "pending") return <CheckingCard />;
  if (hasSentTx) return null;
  return <WaysCard onSendByPhone={onSendByPhone} onScan={onScan} />;
}
