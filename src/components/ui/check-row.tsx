import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import { Text } from "./text";

const CHECK_ICON_SIZE = 14;
const CHECK_ICON_STROKE = 3;

type CheckboxRowProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
  className?: string;
};

/** Checkbox plus wrapping label; `children` may nest `<Text>` for inline links. */
export function CheckboxRow({
  checked,
  onChange,
  children,
  className,
}: CheckboxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      className={cn("mt-5 flex-row items-start gap-3", className)}
    >
      <View
        className={cn(
          "mt-px h-[20px] w-[20px] items-center justify-center rounded-[6px]",
          checked ? "bg-ink" : "border-[1.5px] border-ink-3",
        )}
      >
        {checked ? (
          <Icon
            name="check"
            size={CHECK_ICON_SIZE}
            strokeWidth={CHECK_ICON_STROKE}
            color={colors.bg}
          />
        ) : null}
      </View>
      <Text className="min-w-0 flex-1 text-[14px] leading-[20px] text-ink-2">
        {children}
      </Text>
    </Pressable>
  );
}
