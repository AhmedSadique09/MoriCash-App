import { View } from "react-native";
import Animated, { ZoomIn, useReducedMotion } from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import { Spinner } from "./spinner";
import { Text } from "./text";

type VerifyChecksProps = {
  items: readonly string[];
  /** How many checks have passed so far (the current one is `items[step]`). */
  step: number;
  /** Index of the failing check, -1 when all pass, -2 when nothing is running. */
  failAt: number;
  why: string;
};

type CheckState = "fail" | "done" | "now" | "todo";

const BADGE_SIZE = 20;
const POP_MS = 250;
const GLYPH_SIZE = 12;
const GLYPH_STROKE = 3;
const A11Y_STATE: Record<CheckState, string> = {
  fail: "failed",
  done: "passed",
  now: "checking",
  todo: "waiting",
};

function checkState(
  index: number,
  step: number,
  failAt: number,
): CheckState {
  if (failAt === index && step >= index) return "fail";
  if (index < step) return "done";
  if (index === step && failAt !== -2) return "now";
  return "todo";
}

function Badge({ state, isReduced }: { state: CheckState; isReduced: boolean }) {
  const isFilled = state === "done" || state === "fail";

  return (
    <Animated.View
      entering={isFilled && !isReduced ? ZoomIn.duration(POP_MS) : undefined}
      style={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: BADGE_SIZE / 2,
        backgroundColor: isFilled
          ? state === "fail"
            ? colors.neg
            : colors.pos
          : undefined,
        borderWidth: state === "todo" ? 1.5 : 0,
        borderColor: colors.line,
      }}
    >
      {isFilled ? (
        <Icon
          name={state === "fail" ? "x" : "check"}
          size={GLYPH_SIZE}
          strokeWidth={GLYPH_STROKE}
          color="#FFFFFF"
        />
      ) : null}
      {state === "now" ? <Spinner size={16} /> : null}
    </Animated.View>
  );
}

/** Step-by-step verification list: done, running, failed and pending rows. */
export function VerifyChecks({ items, step, failAt, why }: VerifyChecksProps) {
  const isReduced = useReducedMotion();

  return (
    <View
      accessibilityRole="list"
      className="mt-[14px] gap-[9px] border-t border-line pt-3"
    >
      {items.map((label, index) => {
        const state = checkState(index, step, failAt);
        const text = state === "fail" ? why : label;
        const textClass =
          state === "fail"
            ? "font-text-bold text-neg"
            : state === "done"
              ? "text-ink"
              : state === "now"
                ? "font-text-medium text-ink"
                : "text-ink-3";

        return (
          <View
            key={label}
            accessible
            accessibilityLabel={`${text}, ${A11Y_STATE[state]}`}
            className="flex-row items-center gap-[10px]"
          >
            <Badge state={state} isReduced={isReduced} />
            <Text className={cn("flex-1 text-[14px]", textClass)}>{text}</Text>
          </View>
        );
      })}
    </View>
  );
}
