import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";
import { Text } from "./text";

const DELETE_KEY = "del";
const DECIMAL_KEY = ".";

const KEY_LABELS: Record<string, string> = {
  [DELETE_KEY]: "Delete",
  [DECIMAL_KEY]: "Decimal point",
};

type KeypadProps = {
  onKey: (key: string) => void;
  showDecimal?: boolean;
  compact?: boolean;
};

type KeyProps = {
  keyValue: string;
  heightClass: string;
  onKey: (key: string) => void;
};

function Key({ keyValue, heightClass, onKey }: KeyProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={KEY_LABELS[keyValue] ?? keyValue}
      onPress={() => onKey(keyValue)}
      className={cn(
        "flex-1 items-center justify-center rounded-xl active:bg-surface-2",
        heightClass,
      )}
    >
      {keyValue === DELETE_KEY ? (
        <Icon name="del" size={24} />
      ) : (
        <Text className="font-text-medium text-[24px] tabular-nums">
          {keyValue}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * 3-column numeric pad. Emits "0"-"9", "." (when `showDecimal`) and "del".
 * Not scrollable; the consumer decides where it sits (e.g. `mt-auto`).
 */
export function Keypad({
  onKey,
  showDecimal = false,
  compact = false,
}: KeypadProps) {
  const heightClass = compact ? "h-[50px]" : "h-[54px]";
  const rows: (string | null)[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [showDecimal ? DECIMAL_KEY : null, "0", DELETE_KEY],
  ];

  return (
    <View className="gap-[2px]">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-[2px]">
          {row.map((keyValue, colIndex) =>
            keyValue === null ? (
              <View
                key={`blank-${colIndex}`}
                className={cn("flex-1", heightClass)}
                aria-hidden
              />
            ) : (
              <Key
                key={`key-${keyValue}`}
                keyValue={keyValue}
                heightClass={heightClass}
                onKey={onKey}
              />
            ),
          )}
        </View>
      ))}
    </View>
  );
}
