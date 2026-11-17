import { View } from "react-native";

import { Coin } from "@/components/ui/coin";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Pill } from "@/components/ui/pill";
import { colors } from "@/theme/colors";

/** Soft yellow disc behind each illustration. */
function Glow() {
  return (
    <View
      style={{ pointerEvents: "none" }}
      className="absolute inset-0 items-center justify-center"
    >
      <View className="h-[260px] w-[260px] rounded-full bg-sun-soft" />
    </View>
  );
}

export function UsdtSlideArt() {
  return (
    <>
      <Glow />
      <View className="items-center gap-4">
        <Coin asset="usdt" size={128} fontSize={62} />
        <Pill tone="plain" size="lg" label="1 USDT ≈ US$1.00" />
      </View>
    </>
  );
}

export function PhoneSlideArt() {
  return (
    <>
      <Glow />
      <View className="items-center gap-4">
        <View className="flex-row items-center gap-[14px]">
          <PersonAvatar initials="HM" size={64} tone="me" />
          <Coin asset="usdt" size={44} />
          <PersonAvatar initials="YT" size={64} />
        </View>
        <Pill tone="plain" size="lg" label="+81 90-2468-1357" />
      </View>
    </>
  );
}

export function SecuritySlideArt() {
  return (
    <>
      <Glow />
      <View className="items-center gap-4">
        <View className="h-[120px] w-[120px] items-center justify-center rounded-full bg-sun">
          <Icon
            name="shield"
            size={58}
            strokeWidth={1.6}
            color={colors["on-sun"]}
          />
        </View>
        <View className="flex-row items-center gap-[14px]">
          <Pill label="PIN" />
          <Pill label="Face ID" />
          <Pill label="ID check" />
        </View>
      </View>
    </>
  );
}
