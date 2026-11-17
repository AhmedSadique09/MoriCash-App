import Svg, { Path } from "react-native-svg";

import { colors } from "@/theme/colors";

import { ICON_PATHS, type IconName } from "./icon-paths";

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
};

/** Decorative stroke icon. Put the meaning in the parent's accessibilityLabel. */
export function Icon({
  name,
  size = 22,
  strokeWidth = 1.75,
  color = colors.ink,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d={ICON_PATHS[name]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
