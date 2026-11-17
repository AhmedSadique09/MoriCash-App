import { View } from "react-native";

import { Logo } from "./logo";
import { Text } from "./text";

/** Small logo + wordmark used in headers. */
export function BrandMini() {
  return (
    <View className="flex-row items-center gap-2">
      <Logo size={30} />
      <Text className="font-display text-[19px] tracking-[-0.38px]">
        MoriCash
      </Text>
    </View>
  );
}
