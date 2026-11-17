import { useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Footer, Screen } from "@/components/ui/screen";
import { StatusRing } from "@/components/ui/status-ring";
import { StepList } from "@/components/ui/step-list";
import { Text } from "@/components/ui/text";
import { PlainBar } from "@/components/ui/top-bar";
import { resetTo } from "@/lib/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";

const CLOCK_ICON_SIZE = 34;

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

type Steps = ComponentProps<typeof StepList>["steps"];

function buildSteps(submittedAt: string): Steps {
  return [
    {
      title: "Submitted",
      caption: `Today · ${submittedAt}`,
      icon: "check",
      state: "done",
    },
    {
      title: "Checking your ID and selfie",
      caption: "In progress",
      icon: "clock",
      state: "now",
    },
    { title: "Verified", icon: "shield", state: "later" },
  ];
}

export function KycPendingScreen() {
  const router = useRouter();
  const tier = useOnboardingStore((s) => s.tier);
  // Frozen at mount so the "Submitted" time does not tick on re-render.
  const [submittedAt] = useState(() => formatClock(new Date()));

  useEffect(() => {
    if (tier === 1) resetTo(router, "/kyc/approved");
  }, [tier, router]);

  return (
    <Screen>
      <PlainBar />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <View className="items-center pt-[26px]">
          <StatusRing icon="clock" tone="neu" pulse iconSize={CLOCK_ICON_SIZE} />
          <Text
            accessibilityRole="header"
            className="text-center font-display text-[27px] leading-[31px] tracking-[-0.54px]"
          >
            {"We're checking your details"}
          </Text>
          <Text className="my-[15px] max-w-[300px] text-center leading-[22px] text-ink-2">
            {"This usually takes under 5 minutes. We'll send you a notification when it's done."}
          </Text>
        </View>
        {/* StepList brings its own 18px top margin; the prototype uses 8px here. */}
        <View className="-mt-[10px]">
          <StepList steps={buildSteps(submittedAt)} />
        </View>
      </ScrollView>
      <Footer>
        <Button
          label="Explore the app while you wait"
          variant="sec"
          onPress={() => resetTo(router, "/home")}
        />
      </Footer>
    </Screen>
  );
}
