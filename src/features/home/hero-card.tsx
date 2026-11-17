import { Pressable, StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { Coin } from "@/components/ui/coin";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { fmt, localAmount } from "@/lib/format";
import type { Country } from "@/stores/onboarding-store";

// The hero is a branded object that stays dark, so its colors are fixed.
const GOLD = "#FFD400";
const SKY = "#00B2E5";
const CARD_INK = "#F3F4F6";
const MUTED_72 = "rgba(243,244,246,0.72)";
const MUTED_70 = "rgba(243,244,246,0.7)";
const MUTED_75 = "rgba(243,244,246,0.75)";
const SOFT_FILL = "rgba(255,255,255,0.08)";
const CHIP_FILL = "rgba(255,255,255,0.1)";
const EDGE = "rgba(255,255,255,0.08)";
const CARD_RADIUS = 26;
const MASK_DOTS = "••••••";
const WATERMARK_SIZE = 190;
const WATERMARK_BASELINE = 178;

/** "1234.5" -> ["1,234", "50"]. Manual so output never depends on Intl. */
function splitAmount(amount: number): [string, string] {
  const [whole, cents] = amount.toFixed(2).split(".");
  return [whole.replace(/\B(?=(\d{3})+(?!\d))/g, ","), cents];
}

function Backdrop() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient
            id="homeHeroGlowSun"
            gradientUnits="userSpaceOnUse"
            cx={105}
            cy={-10}
            rx={110}
            ry={120}
          >
            <Stop offset={0} stopColor={GOLD} stopOpacity={0.38} />
            <Stop offset={0.52} stopColor={GOLD} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="homeHeroGlowSky"
            gradientUnits="userSpaceOnUse"
            cx={-10}
            cy={110}
            rx={90}
            ry={90}
          >
            <Stop offset={0} stopColor={SKY} stopOpacity={0.16} />
            <Stop offset={0.6} stopColor={SKY} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#homeHeroGlowSky)" />
        <Rect x={0} y={0} width={100} height={100} fill="url(#homeHeroGlowSun)" />
      </Svg>
      <View
        style={{
          position: "absolute",
          right: -24,
          bottom: -56,
          width: WATERMARK_SIZE,
          height: WATERMARK_SIZE,
        }}
      >
        <Svg width={WATERMARK_SIZE} height={WATERMARK_SIZE}>
          <SvgText
            x={WATERMARK_SIZE / 2}
            y={WATERMARK_BASELINE}
            textAnchor="middle"
            fontFamily="NotoSansJP_700Bold"
            fontSize={WATERMARK_SIZE}
            fill="none"
            stroke="rgba(255,212,0,0.09)"
            strokeWidth={1}
          >
            森
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

type HeaderProps = { isHidden: boolean; onToggleHidden: () => void };

function Header({ isHidden, onToggleHidden }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <Coin asset="usdt" size={24} />
        <Text className="text-[14px]" style={{ color: MUTED_72 }}>
          USDT balance
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isHidden ? "Show balance" : "Hide balance"}
        onPress={onToggleHidden}
        className="h-[34px] w-[34px] items-center justify-center rounded-[10px] active:opacity-70"
        style={{ backgroundColor: SOFT_FILL }}
      >
        <Icon name={isHidden ? "eyeOff" : "eye"} size={18} color={CARD_INK} />
      </Pressable>
    </View>
  );
}

type BalanceProps = {
  balanceUsdt: number;
  isHidden: boolean;
  country: Country;
};

function Balance({ balanceUsdt, isHidden, country }: BalanceProps) {
  const [whole, cents] = splitAmount(balanceUsdt);
  const equivalent = `${fmt(balanceUsdt)} USDT · ≈ ${localAmount(country, balanceUsdt)}`;

  return (
    <View>
      <Text
        className="mt-2 font-display text-[48px] leading-[50px] tracking-[-1.68px] tabular-nums"
        style={{ color: CARD_INK }}
      >
        {isHidden ? (
          MASK_DOTS
        ) : (
          <>
            ${whole}
            <Text
              className="font-display text-[30px] tracking-[-1.05px]"
              style={{ color: "rgba(243,244,246,0.5)" }}
            >
              .{cents}
            </Text>
          </>
        )}
      </Text>
      <Text className="mt-1 text-[14px]" style={{ color: MUTED_70 }}>
        {isHidden ? "Balance hidden" : equivalent}
      </Text>
    </View>
  );
}

type FooterProps = { phoneLabel: string; onMyCode: () => void };

function CardFooter({ phoneLabel, onMyCode }: FooterProps) {
  return (
    <View className="mt-[18px] flex-row items-center justify-between gap-[10px]">
      <View className="min-w-0 flex-1 flex-row items-center gap-[6px]">
        <Icon name="phone" size={14} color={MUTED_75} />
        <Text
          numberOfLines={1}
          className="text-[13px] tabular-nums"
          style={{ color: MUTED_75 }}
        >
          {phoneLabel}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="My code"
        onPress={onMyCode}
        className="h-8 flex-row items-center gap-[6px] rounded-2xl px-3 active:opacity-70"
        style={{ backgroundColor: CHIP_FILL }}
      >
        <Icon name="qr" size={14} strokeWidth={2} color={CARD_INK} />
        <Text className="font-text-semibold text-[13px]" style={{ color: CARD_INK }}>
          My code
        </Text>
      </Pressable>
    </View>
  );
}

type HeroCardProps = {
  balanceUsdt: number;
  isHidden: boolean;
  country: Country;
  phoneLabel: string;
  onToggleHidden: () => void;
  onMyCode: () => void;
};

/** Dark branded balance card at the top of Home. */
export function HeroCard({
  balanceUsdt,
  isHidden,
  country,
  phoneLabel,
  onToggleHidden,
  onMyCode,
}: HeroCardProps) {
  return (
    <View
      className="mt-[18px] overflow-hidden px-5 pb-[18px] pt-5"
      style={{
        borderRadius: CARD_RADIUS,
        backgroundColor: "#0A0B0D",
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 22,
            blurRadius: 40,
            spreadDistance: -26,
            color: "rgba(0,0,0,0.7)",
          },
        ],
      }}
    >
      <Backdrop />
      <Header isHidden={isHidden} onToggleHidden={onToggleHidden} />
      <Balance
        balanceUsdt={balanceUsdt}
        isHidden={isHidden}
        country={country}
      />
      <CardFooter phoneLabel={phoneLabel} onMyCode={onMyCode} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: EDGE,
            pointerEvents: "none",
          },
        ]}
      />
    </View>
  );
}
