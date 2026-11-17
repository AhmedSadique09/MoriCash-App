import { View } from "react-native";

import { cn } from "@/lib/cn";

import { Text } from "./text";

type AvatarTone = "neutral" | "me" | "ghost";

type PersonAvatarProps = {
  initials: string;
  size?: number;
  tone?: AvatarTone;
};

const GLYPH_RATIO = 0.34;

const TONES: Record<AvatarTone, { box: string; text: string }> = {
  neutral: { box: "border border-line bg-surface-2", text: "text-ink" },
  me: { box: "bg-sun", text: "text-on-sun" },
  ghost: { box: "bg-surface-2", text: "text-ink-2" },
};

/** Initials avatar. People stay neutral; your own avatar is brand yellow. */
export function PersonAvatar({
  initials,
  size = 40,
  tone = "neutral",
}: PersonAvatarProps) {
  const palette = TONES[tone];

  return (
    <View
      aria-hidden
      className={cn("items-center justify-center rounded-full", palette.box)}
      style={{ width: size, height: size }}
    >
      <Text
        className={cn("font-text-semibold", palette.text)}
        style={{ fontSize: Math.round(size * GLYPH_RATIO) }}
      >
        {initials}
      </Text>
    </View>
  );
}
