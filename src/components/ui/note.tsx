import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";
import { Text } from "./text";

type NoteTone = "neutral" | "warn";

const TONES: Record<NoteTone, { box: string; text: string; iconColor: string }> =
  {
    neutral: {
      box: "bg-surface-2",
      text: "text-ink-2",
      iconColor: colors["ink-2"],
    },
    warn: { box: "bg-warn-soft", text: "text-ink", iconColor: colors.warn },
  };

type NoteProps = {
  icon: IconName;
  tone?: NoteTone;
  children: ReactNode;
  className?: string;
};

export function Note({ icon, tone = "neutral", children, className }: NoteProps) {
  const palette = TONES[tone];

  return (
    <View
      className={cn(
        "flex-row items-start gap-[10px] rounded-[12px] px-[14px] py-3",
        palette.box,
        className,
      )}
    >
      <View className="mt-px">
        <Icon name={icon} size={18} color={palette.iconColor} />
      </View>
      <Text
        className={cn("min-w-0 flex-1 text-[13px] leading-[19px]", palette.text)}
      >
        {children}
      </Text>
    </View>
  );
}
