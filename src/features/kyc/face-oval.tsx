import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { ClipPath, Circle, Defs, G, Path } from "react-native-svg";

type Props = {
  state: "ready" | "scanning" | "done";
};

// Always-dark "camera" visual: fixed hex values, they do not follow theme tokens.
const DISC_FILL = "#16181D";
const FACE_STROKE = "#3B414B";
const TRACK_STROKE = "#262930";
const ARC_SCANNING = "#FFD400";
const ARC_DONE = "#4CC38A";

const SIZE = 260;
const CENTER = SIZE / 2;
const DISC_RADIUS = 116;
const RING_RADIUS = 125;
const RING_STROKE_WIDTH = 4;
const FACE_STROKE_WIDTH = 3;
// react-native-svg ignores `pathLength` on native, so dash in real user units.
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SCAN_MS = 2400;
const CLIP_ID = "face-oval-clip";

// Full circle drawn clockwise from 12 o'clock, so no group rotation is needed
// (react-native-svg's `origin` props emit an invalid DOM attribute on web).
const ARC_PATH =
  `M ${CENTER} ${CENTER - RING_RADIUS} ` +
  `A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${CENTER} ${CENTER + RING_RADIUS} ` +
  `A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${CENTER} ${CENTER - RING_RADIUS}`;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Drives the arc from empty to full: `ready` empty, `scanning` sweeps, `done` full. */
function useRingProgress(state: Props["state"]) {
  const isReduced = useReducedMotion();
  const progress = useSharedValue(state === "done" ? 1 : 0);

  useEffect(() => {
    if (state === "ready") {
      progress.set(0);
      return;
    }
    if (state === "done" || isReduced) {
      progress.set(1);
      return;
    }
    progress.set(0);
    progress.set(withTiming(1, { duration: SCAN_MS, easing: Easing.linear }));
  }, [state, isReduced, progress]);

  return useAnimatedProps(() => {
    const value = progress.get();
    return {
      strokeDashoffset: RING_CIRCUMFERENCE * (1 - value),
      // A zero-length dash with a round cap would still draw a dot at 12 o'clock.
      strokeOpacity: value > 0 ? 1 : 0,
    };
  });
}

/** Selfie guide: face silhouette inside a circular progress ring. */
export function FaceOval({ state }: Props) {
  const arcProps = useRingProgress(state);

  return (
    <View
      aria-hidden
      className="h-[260px] w-[260px] self-center"
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <ClipPath id={CLIP_ID}>
            <Circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} />
          </ClipPath>
        </Defs>
        <Circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} fill={DISC_FILL} />
        <G clipPath={`url(#${CLIP_ID})`} fill="none" stroke={FACE_STROKE} strokeWidth={FACE_STROKE_WIDTH}>
          <Circle cx={CENTER} cy={112} r={42} />
          <Path d="M50 250c8-50 40-78 80-78s72 28 80 78" />
        </G>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={TRACK_STROKE}
          strokeWidth={RING_STROKE_WIDTH}
        />
        <AnimatedPath
          d={ARC_PATH}
          fill="none"
          stroke={state === "done" ? ARC_DONE : ARC_SCANNING}
          strokeWidth={RING_STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={arcProps}
        />
      </Svg>
    </View>
  );
}
