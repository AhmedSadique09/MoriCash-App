import { Text as RNText, View } from "react-native";

import { colors } from "@/theme/colors";

type LogoProps = {
  size?: number;
  /** `sun` = yellow tile, `ink` = black tile with a yellow mark (splash). */
  tone?: "sun" | "ink";
};

const RADIUS_RATIO = 0.275;
const GLYPH_RATIO = 0.54;

/** The 森 (mori, "forest") brand tile. Sizes follow the prototype's ratios. */
export function Logo({ size = 40, tone = "sun" }: LogoProps) {
  const isInk = tone === "ink";
  const glyphSize = Math.round(size * GLYPH_RATIO);

  return (
    <View
      aria-hidden
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * RADIUS_RATIO),
        backgroundColor: isInk ? colors.bg : colors.sun,
      }}
    >
      <RNText
        style={{
          fontFamily: "NotoSansJP_700Bold",
          fontSize: glyphSize,
          lineHeight: Math.round(glyphSize * 1.25),
          color: isInk ? colors.sun : colors["on-sun"],
          textAlign: "center",
          includeFontPadding: false,
        }}
      >
        森
      </RNText>
    </View>
  );
}
