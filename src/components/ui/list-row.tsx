import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import { Text } from "./text";

type ListRowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  isLast?: boolean;
  align?: "center" | "start";
  className?: string;
};

const CHEVRON_SIZE = 18;

function RowTitle({ children }: { children: ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  return (
    <Text numberOfLines={1} className="font-text-medium text-[16px]">
      {children}
    </Text>
  );
}

function RowSubtitle({ children }: { children: ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  return (
    <Text numberOfLines={1} className="mt-[2px] text-[13px] text-ink-3">
      {children}
    </Text>
  );
}

/** One row of a `ListGroup`; becomes pressable only when `onPress` is given. */
export function ListRow({
  leading,
  title,
  subtitle,
  right,
  showChevron = false,
  onPress,
  isLast = false,
  align = "center",
  className,
}: ListRowProps) {
  const rowClass = cn(
    "flex-row gap-3 py-[14px]",
    align === "center" ? "items-center" : "items-start",
    !isLast && "border-b border-line",
    onPress && "active:opacity-60",
    className,
  );

  const content = (
    <>
      {leading}
      <View className="min-w-0 flex-1">
        <RowTitle>{title}</RowTitle>
        {subtitle ? <RowSubtitle>{subtitle}</RowSubtitle> : null}
      </View>
      {right ? <View className="items-end gap-[3px]">{right}</View> : null}
      {showChevron ? (
        <Icon name="chevR" size={CHEVRON_SIZE} color={colors["ink-3"]} />
      ) : null}
    </>
  );

  if (!onPress) return <View className={rowClass}>{content}</View>;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={rowClass}>
      {content}
    </Pressable>
  );
}
