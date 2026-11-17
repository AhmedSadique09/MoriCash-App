import { View } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";
import { Text } from "./text";

type StepState = "done" | "now" | "later";

type Step = {
  title: string;
  caption?: string;
  icon: IconName;
  state: StepState;
};

type StepListProps = {
  steps: Step[];
};

const BADGE_SIZE = 26;
const ICON_SIZE = 14;

const STATES: Record<
  StepState,
  { badge: string; iconColor: string; iconStroke: number; title: string }
> = {
  done: {
    badge: "bg-pos-soft",
    iconColor: colors.pos,
    iconStroke: 2.5,
    title: "text-ink",
  },
  now: {
    badge: "bg-ink",
    iconColor: colors.bg,
    iconStroke: 2.2,
    title: "text-ink",
  },
  later: {
    badge: "bg-surface-2",
    iconColor: colors["ink-3"],
    iconStroke: 2,
    title: "text-ink-3",
  },
};

const STATE_LABELS: Record<StepState, string> = {
  done: "Done",
  now: "In progress",
  later: "Upcoming",
};

/** Vertical progress list: done / current / upcoming steps with a round badge. */
export function StepList({ steps }: StepListProps) {
  return (
    <View className="mt-[18px]">
      {steps.map((step) => {
        const look = STATES[step.state];
        return (
          <View
            key={step.title}
            accessible
            accessibilityLabel={`${step.title}, ${STATE_LABELS[step.state]}`}
            className="flex-row gap-[14px] py-3"
          >
            <View
              className={cn("items-center justify-center rounded-full", look.badge)}
              style={{ width: BADGE_SIZE, height: BADGE_SIZE }}
            >
              <Icon
                name={step.icon}
                size={ICON_SIZE}
                strokeWidth={look.iconStroke}
                color={look.iconColor}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text className={cn("font-text-semibold", look.title)}>
                {step.title}
              </Text>
              {step.caption ? (
                <Text className="text-[12px] leading-[17px] text-ink-3">
                  {step.caption}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
