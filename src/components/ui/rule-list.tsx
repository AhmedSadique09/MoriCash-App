import { View } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import { Text } from "./text";

const CHECK_ICON_SIZE = 16;
const CHECK_ICON_STROKE = 2.5;

type Rule = { label: string; ok: boolean };

type RuleListProps = { rules: Rule[]; className?: string };

/** Live checklist (e.g. password rules): dim until met, then turns positive. */
export function RuleList({ rules, className }: RuleListProps) {
  return (
    <View className={cn("mt-[14px] gap-[9px]", className)}>
      {rules.map((rule) => (
        <View
          key={rule.label}
          accessible
          accessibilityLabel={`${rule.label}, ${rule.ok ? "done" : "not yet"}`}
          className="flex-row items-center gap-2"
        >
          <View className={cn(!rule.ok && "opacity-30")}>
            <Icon
              name="check"
              size={CHECK_ICON_SIZE}
              strokeWidth={CHECK_ICON_STROKE}
              color={rule.ok ? colors.pos : colors["ink-3"]}
            />
          </View>
          <Text
            className={cn("text-[14px]", rule.ok ? "text-pos" : "text-ink-3")}
          >
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
