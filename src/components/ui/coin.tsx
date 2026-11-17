import { Text as RNText, View } from "react-native";

import { colors } from "@/theme/colors";

type CoinAsset = "usdt" | "mori" | "morx";

type CoinProps = {
  asset: CoinAsset;
  size?: number;
  fontSize?: number;
};

const GLYPH_RATIO = 0.46;

const COINS: Record<
  CoinAsset,
  { glyph: string; bg: string; fg: string; font: string; hasBorder: boolean }
> = {
  usdt: {
    glyph: "T",
    bg: colors.usdt,
    fg: "#FFFFFF",
    font: "InstrumentSans_700Bold",
    hasBorder: false,
  },
  mori: {
    glyph: "森",
    bg: colors.sun,
    fg: colors["on-sun"],
    font: "NotoSansJP_700Bold",
    hasBorder: false,
  },
  morx: {
    glyph: "X",
    bg: colors.bg,
    fg: colors.sky,
    font: "InstrumentSans_700Bold",
    hasBorder: true,
  },
};

/** Round asset badge (USDT, MORI, MORX). */
export function Coin({ asset, size = 40, fontSize }: CoinProps) {
  const coin = COINS[asset];
  const glyphSize = fontSize ?? Math.round(size * GLYPH_RATIO);

  return (
    <View
      aria-hidden
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: coin.bg,
        borderWidth: coin.hasBorder ? 1 : 0,
        borderColor: colors.line,
      }}
    >
      <RNText
        style={{
          fontFamily: coin.font,
          fontSize: glyphSize,
          lineHeight: Math.round(glyphSize * 1.25),
          color: coin.fg,
          textAlign: "center",
          includeFontPadding: false,
        }}
      >
        {coin.glyph}
      </RNText>
    </View>
  );
}
