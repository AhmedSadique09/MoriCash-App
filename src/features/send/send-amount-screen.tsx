import { useRouter } from "expo-router";
import { Pressable, ScrollView, View, type TextStyle } from "react-native";

import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { Icon } from "@/components/ui/icon";
import { Keypad } from "@/components/ui/keypad";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/cn";
import { fmt, fmtInput, localAmount } from "@/lib/format";
import { fullPhone } from "@/lib/phone";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSendStore } from "@/stores/send-store";
import { useWalletStore } from "@/stores/wallet-store";
import { colors } from "@/theme/colors";

import { flowPerson } from "./flow-person";
import { personInitials, personName } from "./people";
import { MIN_SEND, sendError, sendLeft } from "./send-logic";
import { SendSteps } from "./send-steps";

const DELETE_KEY = "del";
const DECIMAL_KEY = ".";
const MAX_DIGITS = 8;
const MAX_DECIMALS = 2;
const QUICK_AMOUNTS = [10, 50, 100] as const;
const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };

/** Applies one keypad press to the raw amount string (max 8 chars, 2 decimals). */
export function applyAmountKey(current: string, key: string): string {
  if (key === DELETE_KEY) return current.slice(0, -1);
  if (key === DECIMAL_KEY) {
    return current.includes(".") ? current : `${current || "0"}.`;
  }
  const decimals = current.split(".")[1];
  if (decimals !== undefined && decimals.length >= MAX_DECIMALS) return current;
  if (current.replace(".", "").length >= MAX_DIGITS) return current;
  return current === "0" ? key : `${current}${key}`;
}

/** Largest amount the user can send now, rounded down to whole cents. */
function maxSendable(balance: number, sentToday: number): string {
  const cents = Math.floor(Math.min(balance, sendLeft(sentToday)) * 100) / 100;
  return cents > 0 ? String(cents) : "";
}

type QuickChipProps = { label: string; hint: string; onPress: () => void };

function QuickChip({ label, hint, onPress }: QuickChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      onPress={onPress}
      className="h-[36px] flex-1 items-center justify-center rounded-[10px] border border-line bg-surface active:bg-surface-2"
    >
      <Text className="font-text-medium text-[14px]" style={TABULAR_NUMS}>
        {label}
      </Text>
    </Pressable>
  );
}

type AmountDisplayProps = {
  amount: string;
  caption: string;
  hasError: boolean;
};

function AmountDisplay({ amount, caption, hasError }: AmountDisplayProps) {
  const valueTone = hasError ? "text-neg" : amount ? "text-ink" : "text-ink-3";

  return (
    <View className="items-center pb-1 pt-6">
      <View className="flex-row items-start justify-center">
        <Text
          className={cn(
            "mr-[3px] mt-[6px] font-display text-[34px] leading-[40px]",
            hasError ? "text-neg" : "text-ink-3",
          )}
        >
          $
        </Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          numberOfLines={1}
          accessibilityLabel={`Amount ${fmtInput(amount)} dollars`}
          className={cn(
            "shrink font-display text-[64px] leading-[68px] tracking-[-2.88px]",
            valueTone,
          )}
          style={TABULAR_NUMS}
        >
          {fmtInput(amount)}
        </Text>
      </View>
      <View className="mt-3 flex-row items-center gap-[6px] self-center rounded-full bg-surface-2 py-1 pl-1 pr-3">
        <Coin asset="usdt" size={24} />
        <Text className="font-text-semibold text-[13px]">USDT</Text>
      </View>
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className={cn(
          "mt-[10px] min-h-[20px] text-center text-[13.5px]",
          hasError ? "font-text-medium text-neg" : "text-ink-3",
        )}
      >
        {caption}
      </Text>
    </View>
  );
}

export function SendAmountScreen() {
  const router = useRouter();
  const flow = useSendStore((state) => state.flow);
  const patchFlow = useSendStore((state) => state.patchFlow);
  const balance = useWalletStore((state) => state.balanceUsdt);
  const sentToday = useWalletStore((state) => state.sentToday);
  const country = useOnboardingStore((state) => state.user?.country) ?? "JP";
  const person = flowPerson(flow);

  if (!person) return null;

  const amount = Number.parseFloat(flow.amount || "0") || 0;
  const error = sendError(amount, balance, sentToday);
  const canReview = amount >= MIN_SEND && error === "";
  const caption =
    error ||
    (amount > 0
      ? `≈ ${localAmount(country, amount)}`
      : `You have ${fmt(balance)} USDT`);

  const setAmount = (next: string) => patchFlow({ amount: next });
  const handleReview = () => {
    patchFlow({ shouldFail: false });
    router.push("/send/review");
  };

  return (
    <Screen>
      <TopBar title="Send USDT" />
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="flex-grow pt-1 pb-2"
        keyboardShouldPersistTaps="handled"
      >
        <SendSteps active={1} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change recipient"
          onPress={() => router.back()}
          className="mt-1 w-full flex-row items-center gap-3 rounded-[16px] border border-line bg-surface py-[10px] pl-[10px] pr-[14px]"
        >
          <PersonAvatar initials={personInitials(person)} size={44} />
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center">
              <Text numberOfLines={1} className="shrink font-text-semibold">
                {personName(person)}
              </Text>
              <VerifiedBadge />
            </View>
            <Text
              className="mt-px text-[12.5px] text-ink-3"
              style={TABULAR_NUMS}
            >
              {fullPhone(person.cc, person.num)}
            </Text>
          </View>
          <Text className="font-text-semibold text-[14px] text-sky">Change</Text>
        </Pressable>

        <AmountDisplay
          amount={flow.amount}
          caption={caption}
          hasError={error !== ""}
        />

        <View className="mt-3 flex-row gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <QuickChip
              key={value}
              label={`$${value}`}
              hint={`Set amount to ${value} USDT`}
              onPress={() => setAmount(String(value))}
            />
          ))}
          <QuickChip
            label="Max"
            hint="Set the maximum amount you can send"
            onPress={() => setAmount(maxSendable(balance, sentToday))}
          />
        </View>

        <View className="flex-row justify-between px-[2px] pt-[10px]">
          <View className="mr-2 shrink flex-row items-center gap-[6px]">
            <Icon name="bolt" size={14} strokeWidth={2} color={colors["ink-2"]} />
            <Text className="shrink text-[13px] text-ink-2">
              Free · usually under a minute
            </Text>
          </View>
          <Text className="text-[13px] text-ink-2" style={TABULAR_NUMS}>
            {fmt(sendLeft(sentToday), 0)} left today
          </Text>
        </View>

        <View className="mt-auto pt-3">
          <Keypad
            showDecimal
            onKey={(key) => setAmount(applyAmountKey(flow.amount, key))}
          />
        </View>
      </ScrollView>
      <Footer>
        <Button label="Review" disabled={!canReview} onPress={handleReview} />
      </Footer>
    </Screen>
  );
}
