import { useEffect, useState, type ReactNode } from "react";
import {
  Pressable,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from "react-native";

import { announce } from "@/lib/announce";
import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";
import { Text } from "./text";

const BORDER_WIDTH = 1;
const BORDER_WIDTH_ACTIVE = 1.5;
const PAD_LEFT = 14;
const PAD_LEFT_WITH_LEFT_SLOT = 4;
const PAD_RIGHT = 4;

type ShellState = { isActive: boolean; hasError: boolean };

/**
 * The prototype draws the outline with an inset box-shadow, so the 1.5px focus
 * ring never moves content. Real borders do, so the padding gives the
 * difference back and the text stays put.
 */
function shellLook({ isActive, hasError }: ShellState, padLeft: number) {
  const isEmphasised = isActive || hasError;
  const borderWidth = isEmphasised ? BORDER_WIDTH_ACTIVE : BORDER_WIDTH;
  const borderClass = cn(
    isEmphasised ? "border-[1.5px]" : "border",
    hasError ? "border-neg" : isActive ? "border-ink" : "border-line",
  );
  return {
    borderClass,
    padding: {
      paddingLeft: padLeft - borderWidth,
      paddingRight: PAD_RIGHT - borderWidth,
    },
  };
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-text-medium text-[13px] text-ink-2">
      {children}
    </Text>
  );
}

/**
 * Speaks a newly shown error. `accessibilityLiveRegion` is Android-only and
 * `role="alert"` is silent on iOS, so one explicit announcement covers both
 * (a live region on top of this would read the error twice on Android).
 */
function useAnnounceError(error?: string) {
  useEffect(() => {
    if (error) announce(error);
  }, [error]);
}

type FieldFooterProps = {
  helper?: string;
  error?: string;
  /** Keeps the empty 18px error line so the layout never jumps when an error appears. */
  isReserved?: boolean;
};

function FieldFooter({ helper, error, isReserved = true }: FieldFooterProps) {
  return (
    <>
      {helper ? (
        <Text className="mt-[6px] text-[12px] leading-[17px] text-ink-3">
          {helper}
        </Text>
      ) : null}
      {isReserved || error ? (
        <View className={cn("mt-[6px]", isReserved && "min-h-[18px]")}>
          {error ? (
            <Text
              accessibilityRole="alert"
              className="font-text-medium text-[13px] leading-[18px] text-neg"
            >
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps["autoComplete"];
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  right?: ReactNode;
  left?: ReactNode;
  onBlur?: () => void;
  maxLength?: number;
  helper?: string;
  /** Drops the reserved error/helper line below the input (an error still shows if one is passed). */
  hideFooter?: boolean;
  className?: string;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoComplete,
  autoCapitalize,
  secureTextEntry,
  right,
  left,
  onBlur,
  maxLength,
  helper,
  hideFooter = false,
  className,
}: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);
  useAnnounceError(error);
  const look = shellLook(
    { isActive: isFocused, hasError },
    left ? PAD_LEFT_WITH_LEFT_SLOT : PAD_LEFT,
  );

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View className={cn("mt-[18px]", className)}>
      <FieldLabel>{label}</FieldLabel>
      <View
        className={cn(
          "h-[52px] flex-row items-center gap-[2px] rounded-[12px] bg-surface",
          look.borderClass,
        )}
        style={look.padding}
      >
        {left}
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors["ink-3"]}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className="h-[48px] min-w-0 flex-1 p-0 font-text text-[16px] text-ink"
        />
        {right}
      </View>
      <FieldFooter helper={helper} error={error} isReserved={!hideFooter} />
    </View>
  );
}

type SelectFieldProps = {
  label: string;
  valueText?: string;
  placeholder: string;
  onPress: () => void;
  icon?: IconName;
  error?: string;
  className?: string;
};

/** Looks like a Field but opens a picker (date sheet, list) instead of a keyboard. */
export function SelectField({
  label,
  valueText,
  placeholder,
  onPress,
  icon = "chevD",
  error,
  className,
}: SelectFieldProps) {
  const hasError = Boolean(error);
  useAnnounceError(error);
  const look = shellLook({ isActive: false, hasError }, PAD_LEFT);
  const hasValue = Boolean(valueText);

  return (
    <View className={cn("mt-[18px]", className)}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${hasValue ? valueText : placeholder}`}
        accessibilityHint={error}
        onPress={onPress}
        className={cn(
          "h-[52px] flex-row items-center justify-between gap-2 rounded-[12px] bg-surface",
          look.borderClass,
        )}
        style={look.padding}
      >
        <Text
          numberOfLines={1}
          className={cn(
            "min-w-0 flex-1 text-[16px]",
            hasValue ? "text-ink" : "text-ink-3",
          )}
        >
          {hasValue ? valueText : placeholder}
        </Text>
        <View className="pr-[10px]">
          <Icon name={icon} size={18} color={colors["ink-2"]} />
        </View>
      </Pressable>
      <FieldFooter error={error} />
    </View>
  );
}
