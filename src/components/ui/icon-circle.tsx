import { View } from "react-native";

import type { IconName } from "./icon-paths";
import { Icon } from "./icon";

type IconCircleProps = {
  icon: IconName;
  size?: number;
  iconSize?: number;
};

/** Neutral circle holding a single icon (non-person avatar). */
export function IconCircle({ icon, size = 40, iconSize = 20 }: IconCircleProps) {
  return (
    <View
      aria-hidden
      className="items-center justify-center rounded-full bg-surface-2"
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={iconSize} />
    </View>
  );
}
