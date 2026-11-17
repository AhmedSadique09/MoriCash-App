import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

/** The 14px label is ~18px tall; this lifts the touch area past 44pt without moving layout. */
const ACTION_HIT_SLOP = { top: 14, bottom: 14, left: 12, right: 12 };

type SectionHeadProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function SectionHead({
  title,
  actionLabel,
  onAction,
  className,
}: SectionHeadProps) {
  return (
    <View className={cn("mb-2 flex-row items-center justify-between", className)}>
      <Text accessibilityRole="header" className="font-text-semibold text-[17px]">
        {title}
      </Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={ACTION_HIT_SLOP}
          onPress={onAction}
          className="active:opacity-60"
        >
          <Text className="font-text-semibold text-[14px] text-sky">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
