import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { Button } from "@/components/ui/button";
import { Footer, Screen } from "@/components/ui/screen";
import { StatusRing } from "@/components/ui/status-ring";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

const RING_ICON_SIZE = 34;

export function BlockedScreen() {
  const router = useRouter();
  const email = useOnboardingStore((state) => state.form.email);

  const handleNotify = () =>
    toast(`Thanks. We'll email ${email || "you"} when your country is added.`);

  return (
    <Screen>
      <TopBar />
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="items-center pt-[30px] pb-7"
      >
        <StatusRing icon="globe" tone="neu" iconSize={RING_ICON_SIZE} />
        <Text
          accessibilityRole="header"
          className="text-center font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          MoriCash isn&apos;t available where you live yet
        </Text>
        <Text className="my-[15px] max-w-[300px] text-center leading-[22px] text-ink-2">
          We serve Japan and the Philippines today. We can email you when your
          country is added.
        </Text>
      </ScrollView>
      <Footer>
        <Button label="Email me when it's ready" onPress={handleNotify} />
        <Button
          label="Change country"
          variant="sec"
          onPress={() => router.back()}
        />
      </Footer>
    </Screen>
  );
}
