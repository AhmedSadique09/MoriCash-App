import { View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

type StatTileProps = {
  label: string;
  value: string;
  tone?: "default" | "pos";
};

/** Small surface tile with a caption label over a large tabular value. */
export function StatTile({ label, value, tone = "default" }: StatTileProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}`}
      className="min-w-0 flex-1 gap-3 rounded-[18px] border border-line bg-surface p-[14px]"
    >
      <Text numberOfLines={1} className="text-[12px] text-ink-3">
        {label}
      </Text>
      <Text
        numberOfLines={1}
        className={cn(
          "font-display text-[22px] tracking-[-0.44px]",
          tone === "pos" && "text-pos",
        )}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </View>
  );
}
