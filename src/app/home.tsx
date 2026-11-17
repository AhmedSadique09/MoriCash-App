import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { resetTo } from "@/lib/navigation";

/** Phase 3 placeholder: the real Home (balance card, activity) replaces this. */
export default function HomeRoute() {
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Logo size={64} />
        <Text className="text-center font-display text-[24px] tracking-[-0.48px]">
          Home arrives in Phase 3
        </Text>
        <Text className="text-center leading-[22px] text-ink-2">
          Onboarding and verification are done. Balance, activity and sending
          come next.
        </Text>
      </View>
      <Footer>
        <Button
          label="Back to start"
          variant="sec"
          onPress={() => resetTo(router, "/welcome")}
        />
      </Footer>
    </Screen>
  );
}
