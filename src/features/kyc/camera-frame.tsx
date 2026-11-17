import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type Props = {
  hasShot: boolean;
  children?: ReactNode;
};

// Always-dark "camera" visual: fixed hex values, they do not follow theme tokens.
const FRAME_GRADIENT = ["#23262D", "#121418"] as const;
const FRAME_ASPECT_RATIO = 1.586;
const FRAME_RADIUS = 14;
const FLASH_START_OPACITY = 0.9;
const FLASH_MS = 450;
// CSS `ease-out`.
const FLASH_EASING = Easing.bezier(0, 0, 0.58, 1);

const CORNER_BASE = "absolute h-[30px] w-[30px] border-[#FFD400]";
const CORNERS = [
  { id: "tl", className: "-left-[6px] -top-[6px] rounded-tl-[14px] border-l-[3px] border-t-[3px]" },
  { id: "tr", className: "-right-[6px] -top-[6px] rounded-tr-[14px] border-r-[3px] border-t-[3px]" },
  { id: "bl", className: "-bottom-[6px] -left-[6px] rounded-bl-[14px] border-b-[3px] border-l-[3px]" },
  { id: "br", className: "-bottom-[6px] -right-[6px] rounded-br-[14px] border-b-[3px] border-r-[3px]" },
] as const;

const styles = StyleSheet.create({
  flash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: FRAME_RADIUS,
    backgroundColor: "#FFFFFF",
    pointerEvents: "none",
  },
});

/** Plays the white shutter flash once, each time `hasShot` flips to true. */
function useShutterFlash(hasShot: boolean) {
  const isReduced = useReducedMotion();
  const flash = useSharedValue(0);
  const wasShot = useRef(hasShot);

  useEffect(() => {
    const justShot = hasShot && !wasShot.current;
    wasShot.current = hasShot;
    if (!justShot || isReduced) return;
    flash.set(
      withSequence(
        withTiming(FLASH_START_OPACITY, { duration: 0 }),
        withTiming(0, { duration: FLASH_MS, easing: FLASH_EASING }),
      ),
    );
  }, [hasShot, isReduced, flash]);

  return useAnimatedStyle(() => ({ opacity: flash.get() }));
}

/** Dark viewfinder with yellow corner brackets; `children` is the captured art. */
export function CameraFrame({ hasShot, children }: Props) {
  const flashStyle = useShutterFlash(hasShot);

  return (
    <View
      className="relative w-full rounded-[14px]"
      style={{ aspectRatio: FRAME_ASPECT_RATIO }}
    >
      <View className="absolute inset-0 overflow-hidden rounded-[14px]">
        <LinearGradient
          colors={FRAME_GRADIENT}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {children}
      {CORNERS.map((corner) => (
        <View key={corner.id} className={`${CORNER_BASE} ${corner.className}`} />
      ))}
      <Animated.View style={[styles.flash, flashStyle]} />
    </View>
  );
}
