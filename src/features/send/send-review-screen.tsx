import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { ScrollView, View, type TextStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";

import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/check-row";
import { DetailList } from "@/components/ui/detail-list";
import { Field } from "@/components/ui/field";
import { HoldButton } from "@/components/ui/hold-button";
import { Icon } from "@/components/ui/icon";
import { KeyboardAvoid } from "@/components/ui/keyboard-avoid";
import { Note } from "@/components/ui/note";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Pill } from "@/components/ui/pill";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { fmt, localAmount } from "@/lib/format";
import { fullPhone } from "@/lib/phone";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSendStore } from "@/stores/send-store";
import { useWalletStore } from "@/stores/wallet-store";
import { colors } from "@/theme/colors";

import { flowPerson } from "./flow-person";
import { personInitials, personName } from "./people";
import { sendError } from "./send-logic";
import { SendSteps } from "./send-steps";

const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };
const AVATAR_SIZE = 68;
const LINE_WIDTH = 96;
const COIN_SIZE = 34;
const COIN_RING = 4;
const COIN_BOX = COIN_SIZE + COIN_RING * 2;
const COIN_TRAVEL = 16;
const COIN_LEG_MS = 900;
const NOTE_MAX_LENGTH = 60;
const FADE_TO_TRANSPARENT = "#2C260800";
const IRREVERSIBLE_WARNING = (name: string) =>
  `Transfers can't be reversed. Make sure ${name} is the person you mean to pay.`;

/** Dashed track with a yellow coin gliding between the two avatars. */
function TransferLine() {
  const isReduced = useReducedMotion();
  const offset = useSharedValue(-COIN_TRAVEL);

  useEffect(() => {
    if (isReduced) {
      offset.set(0);
      return;
    }
    offset.set(
      withRepeat(
        withTiming(COIN_TRAVEL, {
          duration: COIN_LEG_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(offset);
  }, [isReduced, offset]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  return (
    <View
      aria-hidden
      className="mx-[6px] items-center justify-center"
      style={{ width: LINE_WIDTH, height: COIN_BOX }}
    >
      <Svg width={LINE_WIDTH} height={2}>
        <Line
          x1={0}
          y1={1}
          x2={LINE_WIDTH}
          y2={1}
          stroke={colors["ink-3"]}
          strokeWidth={2}
          strokeDasharray="6 5"
        />
      </Svg>
      <Animated.View
        className="absolute items-center justify-center rounded-full bg-surface"
        style={[{ width: COIN_BOX, height: COIN_BOX }, coinStyle]}
      >
        <View
          className="items-center justify-center rounded-full bg-sun"
          style={{ width: COIN_SIZE, height: COIN_SIZE }}
        >
          <Icon name="send" size={15} strokeWidth={2.2} color={colors["on-sun"]} />
        </View>
      </Animated.View>
    </View>
  );
}

type SendCardProps = {
  myInitials: string;
  personInitialsText: string;
  firstName: string;
  amount: number;
  localText: string;
};

function SendCard({
  myInitials,
  personInitialsText,
  firstName,
  amount,
  localText,
}: SendCardProps) {
  return (
    <View className="mt-2 overflow-hidden rounded-[24px] border border-line bg-surface px-[18px] pb-5 pt-6">
      <LinearGradient
        colors={[colors["sun-soft"], FADE_TO_TRANSPARENT]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          opacity: 0.65,
        }}
      />
      <View className="flex-row items-center justify-center">
        <PersonAvatar initials={myInitials} size={AVATAR_SIZE} tone="me" />
        <TransferLine />
        <PersonAvatar initials={personInitialsText} size={AVATAR_SIZE} />
      </View>
      <View className="mt-2 w-[256px] flex-row justify-between self-center">
        <Text
          numberOfLines={1}
          className="w-[76px] text-center font-text-medium text-[13px] text-ink-2"
        >
          You
        </Text>
        <Text
          numberOfLines={1}
          className="w-[76px] text-center font-text-medium text-[13px] text-ink-2"
        >
          {firstName}
        </Text>
      </View>
      <Text
        className="mt-[14px] text-center font-display text-[44px] leading-[48px] tracking-[-1.76px]"
        style={TABULAR_NUMS}
      >
        {fmt(amount)} <Text className="font-display text-[22px] text-ink-3">USDT</Text>
      </Text>
      <Text className="mt-1 text-center text-[12px] leading-[17px] text-ink-3">
        ≈ {localText}
      </Text>
    </View>
  );
}

export function SendReviewScreen() {
  const router = useRouter();
  const flow = useSendStore((state) => state.flow);
  const patchFlow = useSendStore((state) => state.patchFlow);
  const balance = useWalletStore((state) => state.balanceUsdt);
  const sentToday = useWalletStore((state) => state.sentToday);
  const user = useOnboardingStore((state) => state.user);
  const person = flowPerson(flow);

  if (!person) return null;

  const amount = Number.parseFloat(flow.amount) || 0;
  const error = sendError(amount, balance, sentToday);
  const name = personName(person);
  const myInitials = user ? personInitials(user) : "ME";

  const rows = [
    {
      label: "To",
      value: (
        <View className="flex-row items-center">
          <Text className="font-text-medium">{name}</Text>
          <VerifiedBadge />
        </View>
      ),
    },
    { label: "Mobile", value: fullPhone(person.cc, person.num) },
    {
      label: "Recipient verified",
      value: (
        <Pill
          label={flow.via === "qr" ? "QR code" : "Mobile number"}
          tone="pos"
          size="sm"
          icon="check"
        />
      ),
    },
    { label: "Fee", value: "Free" },
    { label: `${person.first} gets`, value: `${fmt(amount)} USDT`, strong: true },
  ];

  return (
    <Screen>
      <KeyboardAvoid>
        <TopBar title="Review" />
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pt-1 pb-7"
          keyboardShouldPersistTaps="handled"
        >
          <SendSteps active={2} />
          <SendCard
            myInitials={myInitials}
            personInitialsText={personInitials(person)}
            firstName={person.first}
            amount={amount}
            localText={localAmount(user?.country ?? "JP", amount)}
          />
          <DetailList className="mt-[14px]" rows={rows} />
          <Field
            className="mt-[14px]"
            label={`Note (optional, ${person.first} will see it)`}
            value={flow.note}
            onChangeText={(note) => patchFlow({ note })}
            placeholder="What's it for?"
            maxLength={NOTE_MAX_LENGTH}
          />
          <Note
            icon="alert"
            tone="warn"
            className={error ? "mt-[14px] bg-neg-soft" : "mt-[14px]"}
          >
            {error || IRREVERSIBLE_WARNING(name)}
          </Note>
          <CheckboxRow
            checked={flow.shouldFail}
            onChange={(shouldFail) => patchFlow({ shouldFail })}
            className="mt-[18px]"
          >
            <Text className="text-[12px] text-ink-2">
              Prototype only: make this fail
            </Text>
          </CheckboxRow>
        </ScrollView>
        <Footer>
          {error ? (
            <Button label="Not enough to send" disabled />
          ) : (
            <HoldButton
              label={`Hold to send $${fmt(amount)}`}
              onConfirm={() => router.push("/send/pin")}
            />
          )}
        </Footer>
      </KeyboardAvoid>
    </Screen>
  );
}
