import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type DimensionValue, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/text";

type Props = {
  side: "front" | "back";
  docName: string;
  fullName: string;
  dob: string;
  country: "JP" | "PH";
};

// Always-dark "camera" art: fixed hex values, they do not follow theme tokens.
const CARD_GRADIENT = ["#EEF1F4", "#C9D2DA"] as const;
const PHOTO_GRADIENT = ["#9AA6B2", "#7D8995"] as const;
const FALLBACK_DOB = "14/03/1991";

const CARD_SHADOW: ViewStyle = {
  shadowColor: "#000000",
  shadowOpacity: 0.4,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};
// CSS `border-radius: 50%` on a non-square box is an ellipse.
const HEAD_STYLE: ViewStyle = { borderRadius: "50%" };

const HASH_OFFSET_BASIS = 2166136261;
const HASH_PRIME = 16777619;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const MRZ_ID_LENGTH = 9;
const MRZ_FILLER = "<";

/** FNV-1a: small, deterministic string hash. */
function hashString(input: string): number {
  let hash = HASH_OFFSET_BASIS;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(i), HASH_PRIME);
  }
  return hash >>> 0;
}

/** Looks random but is a pure function of `seed`, so the card never reshuffles. */
function pseudoHex(seed: number, length: number): string {
  let state = seed;
  let out = "";
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state, LCG_MULTIPLIER) + LCG_INCREMENT) >>> 0;
    // The top bits of an LCG are its best-distributed ones.
    out += (state >>> 28).toString(16);
  }
  return out.toUpperCase();
}

function buildMrz(country: Props["country"], fullName: string, dob: string): string {
  const prefix = `ID${country === "PH" ? "PHL" : "JPN"}`;
  const id = pseudoHex(hashString(`${country}|${fullName}|${dob}`), MRZ_ID_LENGTH);
  const name = fullName.trim().toUpperCase().replace(/\s+/g, "<<");
  const fill = (count: number) => MRZ_FILLER.repeat(count);
  return `${prefix}${id}${fill(8)}\n${name}${fill(6)}`;
}

function Line({ width }: { width: DimensionValue }) {
  return <View className="mt-[5px] h-[5px] rounded-[2px] bg-[#9AA6B2]" style={{ width }} />;
}

function Front({ docName, fullName, dob }: Pick<Props, "docName" | "fullName" | "dob">) {
  return (
    <View className="flex-1 flex-row gap-[10px] px-3 py-[10px]">
      <View className="w-[30%] overflow-hidden rounded-[4px]">
        <LinearGradient colors={PHOTO_GRADIENT} style={StyleSheet.absoluteFill} />
        <View
          className="absolute left-[28%] top-[18%] h-[36%] w-[44%] bg-[#C9D2DA] opacity-70"
          style={HEAD_STYLE}
        />
      </View>
      <View className="flex-1">
        <Text className="font-text-bold text-[10px] leading-[13.5px] tracking-[0.8px] text-[#1E2530]">
          {docName.toUpperCase()}
        </Text>
        <Text className="mt-[6px] font-mono text-[9px] leading-[12.15px] text-[#1E2530]">
          {fullName.toUpperCase()}
        </Text>
        <Text className="font-mono text-[9px] leading-[12.15px] text-[#1E2530]">
          {dob || FALLBACK_DOB}
        </Text>
        <Line width="80%" />
        <Line width="60%" />
        <Line width="70%" />
      </View>
    </View>
  );
}

function Back({ mrz }: { mrz: string }) {
  return (
    <View className="flex-1 px-3 py-[10px]">
      {/* Bleeds into the card padding; the 5px bottom margin + the first line's
          5px top margin reproduce the prototype's collapsed 10px gap. */}
      <View className="-mx-3 -mt-[10px] mb-[5px] h-[26%] bg-[#2B3440]" />
      <Line width="70%" />
      <Line width="55%" />
      <Line width="62%" />
      <Text className="absolute bottom-[10px] left-3 right-3 font-mono text-[8.5px] leading-[11.5px] tracking-[0.51px] text-[#1E2530]">
        {mrz}
      </Text>
    </View>
  );
}

/** Fake ID card art for the KYC capture preview. Fills its parent, inset 7%. */
export function IdCardMock({ side, docName, fullName, dob, country }: Props) {
  return (
    <View
      aria-hidden
      className="absolute bottom-[7%] left-[7%] right-[7%] top-[7%] rounded-[10px] bg-[#C9D2DA]"
      style={CARD_SHADOW}
    >
      <View className="flex-1 overflow-hidden rounded-[10px]">
        <LinearGradient
          colors={CARD_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {side === "front" ? (
          <Front docName={docName} fullName={fullName} dob={dob} />
        ) : (
          <Back mrz={buildMrz(country, fullName, dob)} />
        )}
      </View>
    </View>
  );
}
