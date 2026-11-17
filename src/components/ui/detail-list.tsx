import type { ReactNode } from "react";
import { View, type TextStyle } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };

type DetailRow = { label: string; value: ReactNode; strong?: boolean };

function isPlainValue(value: ReactNode): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

type DetailItemProps = { row: DetailRow; isLast: boolean };

function DetailItem({ row, isLast }: DetailItemProps) {
  const { label, value, strong = false } = row;

  return (
    <View
      className={cn(
        "flex-row items-center justify-between gap-4 py-[13px]",
        !isLast && "border-b border-line",
      )}
    >
      <Text
        className={cn(
          "shrink-0 text-[15px] text-ink-2",
          strong && "font-text-semibold text-ink",
        )}
      >
        {label}
      </Text>
      <View className="min-w-0 flex-1 flex-row items-center justify-end gap-[6px]">
        {isPlainValue(value) ? (
          <Text
            className={cn(
              "shrink text-right font-text-medium text-[15px]",
              strong && "font-text-semibold",
            )}
            style={TABULAR_NUMS}
          >
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

type DetailListProps = { rows: DetailRow[]; className?: string };

/** Label / value summary rows (receipt, review screens). */
export function DetailList({ rows, className }: DetailListProps) {
  return (
    <View
      className={cn(
        "rounded-[16px] border border-line bg-surface px-4",
        className,
      )}
    >
      {rows.map((row, index) => (
        <DetailItem
          key={`${row.label}-${index}`}
          row={row}
          isLast={index === rows.length - 1}
        />
      ))}
    </View>
  );
}
