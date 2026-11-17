import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

type ListGroupProps = { children: ReactNode; className?: string };

/** Rounded surface that holds `RadioRow`s (or any rows) with hairline dividers. */
export function ListGroup({ children, className }: ListGroupProps) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-[16px] border border-line bg-surface px-4",
        className,
      )}
    >
      {children}
    </View>
  );
}

function RadioMark({ isSelected }: { isSelected: boolean }) {
  return (
    <View
      className={cn(
        "h-[20px] w-[20px] items-center justify-center rounded-full border-[1.5px]",
        isSelected ? "border-ink" : "border-ink-3",
      )}
    >
      {isSelected ? <View className="h-[10px] w-[10px] rounded-full bg-ink" /> : null}
    </View>
  );
}

type RadioRowProps = {
  label: string;
  sublabel?: string;
  leading?: ReactNode;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
};

export function RadioRow({
  label,
  sublabel,
  leading,
  selected,
  onPress,
  isLast = false,
}: RadioRowProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 py-[14px] active:opacity-60",
        !isLast && "border-b border-line",
      )}
    >
      {leading}
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-text-medium text-[16px]">
          {label}
        </Text>
        {sublabel ? (
          <Text numberOfLines={1} className="mt-[2px] text-[13px] text-ink-3">
            {sublabel}
          </Text>
        ) : null}
      </View>
      <RadioMark isSelected={selected} />
    </Pressable>
  );
}
