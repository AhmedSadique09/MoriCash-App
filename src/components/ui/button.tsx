import { useRef } from "react";
import { ActivityIndicator, Pressable } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";
import { Text } from "./text";

type ButtonVariant = "pri" | "sec" | "out" | "ghost";
type ButtonSize = "md" | "sm";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

const VARIANTS: Record<
  ButtonVariant,
  { box: string; text: string; iconColor: string }
> = {
  pri: { box: "bg-sun", text: "text-on-sun", iconColor: colors["on-sun"] },
  sec: { box: "bg-surface-2", text: "text-ink", iconColor: colors.ink },
  out: {
    box: "border border-line bg-surface",
    text: "text-ink",
    iconColor: colors.ink,
  },
  ghost: { box: "bg-transparent", text: "text-ink", iconColor: colors.ink },
};

const SIZES: Record<ButtonSize, { box: string; text: string }> = {
  md: { box: "h-[52px] w-full rounded-xl", text: "text-[16px]" },
  sm: { box: "h-[38px] self-start rounded-[10px] px-[14px]", text: "text-[14px]" },
};

/** expo-router `push` does not dedupe, so a double tap would stack two screens. */
const PRESS_LOCKOUT_MS = 600;

export function Button({
  label,
  onPress,
  variant = "pri",
  size = "md",
  icon,
  disabled = false,
  isLoading = false,
  className,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const tone = VARIANTS[variant];
  const dims = SIZES[size];
  const lastPressAt = useRef(0);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastPressAt.current < PRESS_LOCKOUT_MS) return;
    lastPressAt.current = now;
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={handlePress}
      className={cn(
        "flex-row items-center justify-center gap-2 overflow-hidden active:scale-[0.985]",
        dims.box,
        tone.box,
        isDisabled && "opacity-[0.38]",
        className,
      )}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={tone.iconColor} />
      ) : icon ? (
        <Icon name={icon} size={18} strokeWidth={2} color={tone.iconColor} />
      ) : null}
      <Text className={cn("font-text-semibold", dims.text, tone.text)}>
        {label}
      </Text>
    </Pressable>
  );
}
