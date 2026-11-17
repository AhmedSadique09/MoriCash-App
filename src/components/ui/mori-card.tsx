import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { colors } from "@/theme/colors";

import { Coin } from "./coin";
import { Icon } from "./icon";
import { Logo } from "./logo";
import { Text } from "./text";

type MoriCardProps = {
  name: string;
  phone: string;
  balanceUsd: number;
  localText: string;
  hidden?: boolean;
  onCopyPhone?: () => void;
};

// The card is a physical object, so its colors are fixed (not theme tokens).
const GOLD = "#FFD400";
const CHIP_TEXT = "#C9CDD3";
const CHIP_BG = "rgba(255,255,255,0.08)";
const EDGE = "rgba(255,255,255,0.09)";
const CARD_RADIUS = 22;
const CARD_ASPECT = 1.62;
const MASK_DOTS = "••••••";

// CSS `linear-gradient(140deg, ...)` re-expressed in unit coordinates for a
// 1.62:1 box, so the gradient keeps its true angle on a non-square view.
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1.126, y: 0.828 };

const WATERMARK_SIZE = 200;
const WATERMARK_BASELINE = 187;

/** "1234.5" -> ["1,234", "50"]. Manual so output never depends on Intl. */
function splitAmount(amount: number): [string, string] {
  const [whole, cents] = amount.toFixed(2).split(".");
  return [whole.replace(/\B(?=(\d{3})+(?!\d))/g, ","), cents];
}

function Backdrop() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <LinearGradient
        colors={["#1C1F25", "#0A0B0D", "#050506"]}
        locations={[0, 0.55, 1]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient
            id="moriCardGlow"
            gradientUnits="userSpaceOnUse"
            cx={108}
            cy={-12}
            rx={70}
            ry={110}
          >
            <Stop offset={0} stopColor={GOLD} stopOpacity={0.5} />
            <Stop offset={0.52} stopColor={GOLD} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#moriCardGlow)" />
      </Svg>
      <View
        style={{
          position: "absolute",
          right: -18,
          bottom: -62,
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
            stroke="rgba(255,212,0,0.12)"
            strokeWidth={1}
          >
            森
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

function Header() {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row items-center gap-2">
        <Logo size={24} />
        <Text className="font-display text-[18px] tracking-[-0.36px]">
          MoriCash
        </Text>
      </View>
      <Text className="font-text-bold text-[10px] uppercase tracking-[1.4px] opacity-75">
        Wallet
      </Text>
    </View>
  );
}

type BalanceProps = Pick<MoriCardProps, "balanceUsd" | "localText" | "hidden">;

function Balance({ balanceUsd, localText, hidden = false }: BalanceProps) {
  const [whole, cents] = splitAmount(balanceUsd);

  return (
    <View>
      <Text className="text-[12px] text-[#A3A9B3]">Wallet balance</Text>
      <Text className="mt-0.5 font-display text-[36px] leading-[40px] tracking-[-1.26px] tabular-nums">
        {hidden ? (
          MASK_DOTS
        ) : (
          <>
            ${whole}
            <Text className="font-display text-[24px] tracking-[-1.26px] text-ink-3">
              .{cents}
            </Text>
          </>
        )}
      </Text>
      <Text className="mt-0.5 text-[12px] text-[#A3A9B3]">
        {hidden ? "Balances hidden" : `≈ ${localText}`}
      </Text>
    </View>
  );
}

type PhoneChipProps = { phone: string; onPress?: () => void };

function PhoneChip({ phone, onPress }: PhoneChipProps) {
  const content = (
    <>
      <Text className="font-mono text-[12px] text-[#C9CDD3]">{phone}</Text>
      <Icon name="copy" size={13} color={CHIP_TEXT} />
    </>
  );
  const chipStyle = {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: CHIP_BG,
  } as const;

  if (!onPress) return <View style={chipStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Copy your MoriCash number"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [chipStyle, { opacity: pressed ? 0.7 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

/** The black MoriCash wallet card (balance, owner name and phone number). */
export function MoriCard({
  name,
  phone,
  balanceUsd,
  localText,
  hidden,
  onCopyPhone,
}: MoriCardProps) {
  return (
    <View
      style={{
        width: "100%",
        aspectRatio: CARD_ASPECT,
        borderRadius: CARD_RADIUS,
        overflow: "hidden",
        backgroundColor: colors.bg,
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 22,
            blurRadius: 40,
            spreadDistance: -20,
            color: "rgba(0,0,0,0.6)",
          },
        ],
      }}
    >
      <Backdrop />
      <View className="flex-1 justify-between px-5 py-[18px]">
        <Header />
        <Balance
          balanceUsd={balanceUsd}
          localText={localText}
          hidden={hidden}
        />
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={1}
              className="font-text-semibold text-[12px] uppercase tracking-[1.44px]"
            >
              {name}
            </Text>
            <PhoneChip phone={phone} onPress={onCopyPhone} />
          </View>
          <Coin asset="usdt" size={24} />
        </View>
      </View>
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
