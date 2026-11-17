import { View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

const CODE_LENGTH = 6;
const BOX_INDICES = Array.from({ length: CODE_LENGTH }, (_, index) => index);

type CodeBoxesProps = {
  value: string;
  hasError?: boolean;
};

function boxBorderClass(isCurrent: boolean, hasError: boolean): string {
  // Error wins over the "current box" highlight, like the prototype's `.bad`.
  if (hasError) return "border-[1.5px] border-neg";
  if (isCurrent) return "border-[1.5px] border-ink";
  return "border border-line";
}

export function CodeBoxes({ value, hasError = false }: CodeBoxesProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${value.length} of ${CODE_LENGTH} digits entered`}
      accessibilityLiveRegion="polite"
      className="mb-[6px] mt-[26px] flex-row gap-2"
    >
      {BOX_INDICES.map((index) => (
        <View
          key={index}
          className={cn(
            "h-[56px] flex-1 items-center justify-center rounded-xl bg-surface",
            boxBorderClass(index === value.length, hasError),
          )}
        >
          {value[index] ? (
            <Text className="font-mono-medium text-[22px]">{value[index]}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
