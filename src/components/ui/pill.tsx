import { View } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";
import { Text } from "./text";

type PillTone = "pos" | "warn" | "neg" | "neu" | "sun" | "solid" | "plain";
type PillSize = "sm" | "lg";

type PillProps = {
  label: string;
  tone?: PillTone;
  size?: PillSize;
  icon?: IconName;
  className?: string;
};

const TONES: Record<PillTone, { box: string; text: string; iconColor: string }> =
  {
    pos: { box: "bg-pos-soft", text: "text-pos", iconColor: colors.pos },
    warn: { box: "bg-warn-soft", text: "text-warn", iconColor: colors.warn },
    neg: { box: "bg-neg-soft", text: "text-neg", iconColor: colors.neg },
    neu: { box: "bg-surface-2", text: "text-ink-2", iconColor: colors["ink-2"] },
    sun: { box: "bg-sun-soft", text: "text-ink", iconColor: colors.ink },
    solid: { box: "bg-sun", text: "text-on-sun", iconColor: colors["on-sun"] },
    plain: { box: "bg-surface", text: "text-ink", iconColor: colors.ink },
  };

const SIZES: Record<
  PillSize,
  { box: string; text: string; iconSize: number }
> = {
  sm: { box: "h-[22px] gap-1 rounded-[11px] px-2", text: "text-[12px]", iconSize: 12 },
  lg: { box: "h-8 gap-1.5 rounded-2xl px-[14px]", text: "text-[14px]", iconSize: 14 },
};

export function Pill({
  label,
  tone = "neu",
  size = "sm",
  icon,
  className,
}: PillProps) {
  const palette = TONES[tone];
  const dims = SIZES[size];

  return (
    <View
      className={cn(
        "flex-row items-center self-start",
        dims.box,
        palette.box,
        className,
      )}
    >
      {icon ? (
        <Icon
          name={icon}
          size={dims.iconSize}
          strokeWidth={2.4}
          color={palette.iconColor}
        />
      ) : null}
      <Text className={cn("font-text-semibold", dims.text, palette.text)}>
        {label}
      </Text>
    </View>
  );
}
