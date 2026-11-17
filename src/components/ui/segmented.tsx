import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "md" | "sm";
  className?: string;
};

const ACTIVE_SHADOW = {
  shadowColor: "#000000",
  shadowOpacity: 0.12,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;

/** Equal-width segmented control (tab semantics, one option selected). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const isSmall = size === "sm";

  return (
    <View
      accessibilityRole="tablist"
      className={cn("flex-row gap-[2px] rounded-[12px] bg-surface-2 p-[3px]", className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            className={cn(
              "flex-1 items-center justify-center rounded-[9px]",
              isSmall ? "h-[28px] px-[10px]" : "h-[34px]",
              isSelected && "bg-surface",
            )}
            style={isSelected ? ACTIVE_SHADOW : undefined}
          >
            <Text
              numberOfLines={1}
              className={cn(
                "font-text-medium",
                isSmall ? "text-[13px]" : "text-[14px]",
                isSelected ? "text-ink" : "text-ink-2",
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
