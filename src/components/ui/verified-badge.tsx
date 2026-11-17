import { View } from "react-native";

import { Icon } from "./icon";

type VerifiedBadgeProps = { size?: "md" | "sm" };

const DIMENSIONS = {
  md: { box: 16, icon: 10, margin: 6 },
  sm: { box: 14, icon: 9, margin: 5 },
} as const;

const CHECK_STROKE = 3.2;

/** Small sky "ID verified" check next to a person's name. */
export function VerifiedBadge({ size = "md" }: VerifiedBadgeProps) {
  const d = DIMENSIONS[size];

  return (
    <View
      accessible
      accessibilityLabel="ID verified"
      className="items-center justify-center rounded-full bg-sky"
      style={{ width: d.box, height: d.box, marginLeft: d.margin }}
    >
      <Icon name="check" size={d.icon} strokeWidth={CHECK_STROKE} color="#FFFFFF" />
    </View>
  );
}
