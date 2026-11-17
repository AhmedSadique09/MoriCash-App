import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/components/ui/icon-paths";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

type QuickActionProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
  isPrimary?: boolean;
};

function QuickAction({ label, icon, onPress, isPrimary = false }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-1 items-center gap-2 active:scale-[0.94]"
    >
      <View
        className={cn(
          "h-[58px] w-[58px] items-center justify-center rounded-[20px]",
          isPrimary ? "bg-sun" : "border border-line bg-surface",
        )}
      >
        <Icon
          name={icon}
          size={isPrimary ? 24 : 22}
          strokeWidth={isPrimary ? 2 : 1.75}
          color={isPrimary ? colors["on-sun"] : colors.ink}
        />
      </View>
      <Text className="font-text-medium text-[13px]">{label}</Text>
    </Pressable>
  );
}

type QuickActionsProps = {
  onSend: () => void;
  onScan: () => void;
  onReceive: () => void;
};

/** Send / Scan / Receive shortcuts under the hero card. */
export function QuickActions({ onSend, onScan, onReceive }: QuickActionsProps) {
  return (
    <View className="mt-5 flex-row gap-2">
      <QuickAction label="Send" icon="send" onPress={onSend} isPrimary />
      <QuickAction label="Scan" icon="scan" onPress={onScan} />
      <QuickAction label="Receive" icon="qr" onPress={onReceive} />
    </View>
  );
}
