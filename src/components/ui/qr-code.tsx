import { View } from "react-native";
import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";

import { colors } from "@/theme/colors";

type QrCodeProps = {
  seed: string;
  /** Outer width/height of the white card (prototype: 212). */
  size: number;
};

const MODULES = 29;
const FINDER_SIZE = 7;
const FINDER_ZONE = 8;
const FILL_RATIO = 0.47;
const MODULE_SIZE = 1.02;
const INK = "#0A0B0D";
const PAPER = "#FFFFFF";
const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;
const MULBERRY_STEP = 0x6d2b79f5;
const UINT32_RANGE = 4294967296;

// Prototype `.qr` is 212 wide with 16px padding and a 20px radius.
const REF_SIZE = 212;
const REF_PADDING = 16;
const REF_RADIUS = 20;

/** FNV-1a hash of the seed, then a mulberry32 stream: same codes as the prototype. */
function createRng(seed: string): () => number {
  let h = FNV_OFFSET;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, FNV_PRIME);
  }
  return () => {
    h += MULBERRY_STEP;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

function isInFinderZone(x: number, y: number): boolean {
  const far = MODULES - FINDER_ZONE - 1;
  return (
    (x < FINDER_ZONE && y < FINDER_ZONE) ||
    (x > far && y < FINDER_ZONE) ||
    (x < FINDER_ZONE && y > far)
  );
}

function buildModulesPath(seed: string): string {
  const rnd = createRng(seed);
  const cell = `h${MODULE_SIZE}v${MODULE_SIZE}h-${MODULE_SIZE}z`;
  let d = "";
  for (let y = 0; y < MODULES; y += 1) {
    for (let x = 0; x < MODULES; x += 1) {
      if (isInFinderZone(x, y)) continue;
      if (rnd() < FILL_RATIO) d += `M${x} ${y}${cell}`;
    }
  }
  return d;
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y} width={7} height={7} fill={INK} />
      <Rect x={x + 1} y={y + 1} width={5} height={5} fill={PAPER} />
      <Rect x={x + 2} y={y + 2} width={3} height={3} fill={INK} />
    </>
  );
}

/** Deterministic sample MoriCash QR (not scannable): same seed, same code. */
export function QrCode({ seed, size }: QrCodeProps) {
  const padding = Math.round((size * REF_PADDING) / REF_SIZE);
  const inner = size - padding * 2;
  const far = MODULES - FINDER_SIZE;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Sample MoriCash QR code"
      style={{
        width: size,
        height: size,
        padding,
        borderRadius: (size * REF_RADIUS) / REF_SIZE,
        backgroundColor: PAPER,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Svg width={inner - 2} height={inner - 2} viewBox={`0 0 ${MODULES} ${MODULES}`}>
        <Rect width={MODULES} height={MODULES} fill={PAPER} />
        <Path d={buildModulesPath(seed)} fill={INK} />
        <Finder x={0} y={0} />
        <Finder x={far} y={0} />
        <Finder x={0} y={far} />
        <Rect x={11.5} y={11.5} width={6} height={6} rx={1.4} fill={colors.sun} />
        <SvgText
          x={14.5}
          y={16.2}
          fontSize={4.6}
          textAnchor="middle"
          fontFamily="NotoSansJP_700Bold"
          fill={INK}
        >
          森
        </SvgText>
      </Svg>
    </View>
  );
}
