import { Pressable } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/cn";

// The text is ~30pt tall with its padding; this stretches the touch area to >= 44pt.
const LINK_HIT_SLOP = { top: 9, bottom: 9, left: 8, right: 8 } as const;

type Props = {
  label: string;
  onPress: () => void;
  className?: string;
};

/** Sky-blue inline action ("Log in", "Resend code") with a 44pt touch target. */
export function LinkButton({ label, onPress, className }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={LINK_HIT_SLOP}
      onPress={onPress}
      className={cn("py-[6px]", className)}
    >
      <Text className="font-text-semibold text-[14px] text-sky">{label}</Text>
    </Pressable>
  );
}
