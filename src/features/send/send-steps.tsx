import { View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";

const STEP_LABELS = ["Recipient", "Amount", "Confirm"] as const;
const CHECK_SIZE = 10;
const CHECK_STROKE = 3.2;
const WHITE = "#FFFFFF";

type StepState = "done" | "on" | "todo";

type SendStepsProps = { active: 0 | 1 | 2 };

const TRACK_CLASS: Record<StepState, string> = {
  done: "border-pos",
  on: "border-ink",
  todo: "border-line",
};

const LABEL_CLASS: Record<StepState, string> = {
  done: "text-pos",
  on: "text-ink",
  todo: "text-ink-3",
};

const DOT_CLASS: Record<StepState, string> = {
  done: "bg-pos",
  on: "bg-ink",
  todo: "bg-surface-2",
};

function stepState(index: number, active: number): StepState {
  if (index < active) return "done";
  return index === active ? "on" : "todo";
}

type StepProps = { label: string; index: number; state: StepState };

function Step({ label, index, state }: StepProps) {
  return (
    <View
      className={cn(
        "flex-1 flex-row items-center gap-[6px] border-t-[3px] pt-2",
        TRACK_CLASS[state],
      )}
    >
      <View
        className={cn(
          "h-[18px] w-[18px] items-center justify-center rounded-full",
          DOT_CLASS[state],
        )}
      >
        {state === "done" ? (
          <Icon
            name="check"
            size={CHECK_SIZE}
            strokeWidth={CHECK_STROKE}
            color={WHITE}
          />
        ) : (
          <Text
            className={cn(
              "font-text-semibold text-[10.5px]",
              state === "on" ? "text-bg" : "text-ink-3",
            )}
          >
            {index + 1}
          </Text>
        )}
      </View>
      <Text className={cn("font-text-semibold text-[12px]", LABEL_CLASS[state])}>
        {label}
      </Text>
    </View>
  );
}

/** "Recipient / Amount / Confirm" progress strip shown on every send step. */
export function SendSteps({ active }: SendStepsProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Step ${active + 1} of ${STEP_LABELS.length}`}
      className="mb-[14px] mt-[2px] flex-row gap-[6px]"
    >
      {STEP_LABELS.map((label, index) => (
        <Step
          key={label}
          label={label}
          index={index}
          state={stepState(index, active)}
        />
      ))}
    </View>
  );
}
