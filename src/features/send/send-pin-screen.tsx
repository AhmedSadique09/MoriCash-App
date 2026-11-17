import { useRouter } from "expo-router";
import { View } from "react-native";

import { Keypad } from "@/components/ui/keypad";
import { PinDots } from "@/components/ui/pin-dots";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import { BottomSpacer } from "@/features/auth/bottom-spacer";
import { LinkButton } from "@/features/auth/link-button";
import { usePinEntry } from "@/features/auth/pin-create-screen";
import { fmt } from "@/lib/format";
import { useSendStore } from "@/stores/send-store";
import { toast } from "@/stores/toast-store";

import { PEOPLE, personName } from "./people";

const SOON_MESSAGE = "Not part of this prototype yet";

export function SendPinScreen() {
  const router = useRouter();
  const flow = useSendStore((state) => state.flow);
  const person = flow.to ? PEOPLE[flow.to] : undefined;
  const amount = Number.parseFloat(flow.amount) || 0;

  // Prototype: any 6-digit PIN confirms the transfer.
  const { pin, error, shakeKey, handleKey } = usePinEntry(() => {
    router.replace("/send/track");
    return null;
  });

  const subtitle = person
    ? `Send ${fmt(amount)} USDT to ${personName(person)}.`
    : "";

  return (
    <Screen>
      <TopBar title="Confirm transfer" />
      <View className="flex-1 px-5 pt-1">
        <Text
          accessibilityRole="header"
          className="mb-2 mt-[18px] text-center font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          Enter your PIN
        </Text>
        <Text className="text-center leading-[22px] text-ink-2">{subtitle}</Text>

        <PinDots length={pin.length} shakeKey={shakeKey} />
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="mt-[6px] min-h-[18px] text-center font-text-medium text-[13px] text-neg"
        >
          {error}
        </Text>
        <View className="items-center">
          <LinkButton label="Forgot PIN?" onPress={() => toast(SOON_MESSAGE)} />
        </View>

        <View className="mt-auto">
          <Keypad onKey={handleKey} showDecimal={false} />
        </View>
      </View>
      <BottomSpacer />
    </Screen>
  );
}
