import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { DetailList } from "@/components/ui/detail-list";
import { MoriCard } from "@/components/ui/mori-card";
import { Pill } from "@/components/ui/pill";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { PlainBar } from "@/components/ui/top-bar";
import { WinStage } from "@/components/ui/win-stage";
import { resetTo } from "@/lib/navigation";
import { startSend } from "@/features/send/start-send";
import { fullPhone } from "@/lib/phone";
import {
  useOnboardingStore,
  type Country,
  type User,
} from "@/stores/onboarding-store";

// Direct entry (no signup yet) falls back to the prototype's demo user.
const FALLBACK_USER: User = {
  first: "Haruki",
  last: "Morita",
  name: "Haruki Morita",
  email: "haruki.morita@example.com",
  country: "JP",
  dob: "14/03/1991",
  cc: "+81",
  num: "9011112222",
};

const STARTER_BALANCE_USD = 500;
const LOCAL_BALANCE_TEXT: Record<Country, string> = {
  JP: "¥75,000",
  PH: "₱29,000",
};

const LIMIT_ROWS = [
  { label: "Send to people", value: "Up to 1,000 USDT a day" },
  { label: "Receive", value: "No limit" },
  { label: "Fee", value: "Free" },
];

export function KycApprovedScreen() {
  const router = useRouter();
  const user = useOnboardingStore((s) => s.user) ?? FALLBACK_USER;

  const handleHome = () => resetTo(router, "/home");

  const handleSend = () => {
    // Leave onboarding for Home first, then open the real send flow on top.
    handleHome();
    startSend(router);
  };

  return (
    <Screen>
      <PlainBar />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <View className="mt-2 items-center pt-1">
          <WinStage asset="mori" />
          <Pill
            label="Tier 1 verified"
            tone="pos"
            icon="shield"
            className="self-center"
          />
          <Text
            accessibilityRole="header"
            className="mt-[10px] text-center font-display text-[24px] leading-[29px] tracking-[-0.48px]"
          >
            {"You're verified"}
          </Text>
          <Text className="mt-2 max-w-[300px] text-center leading-[22px] text-ink-2">
            {`Welcome to MoriCash, ${user.first}. Your wallet is ready.`}
          </Text>
        </View>
        <View className="mt-[14px] pb-[10px] pt-[6px]">
          <MoriCard
            name={user.name}
            phone={fullPhone(user.cc, user.num)}
            balanceUsd={STARTER_BALANCE_USD}
            localText={LOCAL_BALANCE_TEXT[user.country]}
          />
        </View>
        <DetailList rows={LIMIT_ROWS} className="mt-3" />
      </ScrollView>
      <Footer>
        <Button label="Send USDT" icon="send" onPress={handleSend} />
        <Button label="Go to home" variant="ghost" onPress={handleHome} />
      </Footer>
      <Confetti />
    </Screen>
  );
}
