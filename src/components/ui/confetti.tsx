import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const PIECE_COUNT = 70;
const COLORS = ["#FFD400", "#0A0B0D", "#4CC38A", "#00B2E5", "#FFE766"];

// Physics are the prototype's per-frame canvas loop, solved in closed form so
// one elapsed-time value can drive every piece (frames run at 60 fps).
const DURATION_MS = 1900;
const FRAME_MS = 1000 / 60;
const GRAVITY = 0.25;
const DRAG = 0.99;
const ORIGIN_Y = 150;
const ORIGIN_SPREAD = 40;
const SIDE_SPEED = 9;
const MIN_LIFT = 4;
const LIFT_RANGE = 9;
const MIN_SIZE = 4;
const SIZE_RANGE = 6;
const SPIN_SPEED = 0.3;
const FULL_TURN = 6;

type Piece = {
  color: string;
  width: number;
  height: number;
  startX: number;
  speedX: number;
  speedY: number;
  angle: number;
  spin: number;
};

function createPiece(): Piece {
  const size = Math.random() * SIZE_RANGE + MIN_SIZE;
  return {
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: size,
    height: size / 2,
    startX: (Math.random() - 0.5) * ORIGIN_SPREAD,
    speedX: (Math.random() - 0.5) * SIDE_SPEED,
    speedY: -(Math.random() * LIFT_RANGE + MIN_LIFT),
    angle: Math.random() * FULL_TURN,
    spin: (Math.random() - 0.5) * SPIN_SPEED,
  };
}

type PieceViewProps = {
  piece: Piece;
  elapsedMs: SharedValue<number>;
};

function PieceView({ piece, elapsedMs }: PieceViewProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const ms = elapsedMs.get();
    const frames = ms / FRAME_MS;
    const drift = (DRAG * (1 - Math.pow(DRAG, frames))) / (1 - DRAG);
    const fall = piece.speedY * frames + (GRAVITY * frames * (frames + 1)) / 2;
    return {
      opacity: Math.max(0, 1 - ms / DURATION_MS),
      transform: [
        { translateX: piece.startX + piece.speedX * drift },
        { translateY: fall },
        { rotate: `${piece.angle + piece.spin * frames}rad` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: -piece.width / 2,
          top: -piece.height / 2,
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * One-shot confetti burst from the top-center of its parent (150px down),
 * gone after ~1.9s. Render it as a sibling inside the screen body.
 */
export function Confetti() {
  const isReduced = useReducedMotion();
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: PIECE_COUNT }, createPiece),
  );
  const [isDone, setIsDone] = useState(false);
  const elapsedMs = useSharedValue(0);

  useEffect(() => {
    if (isReduced) return;
    elapsedMs.set(
      withTiming(DURATION_MS, { duration: DURATION_MS, easing: Easing.linear }),
    );
    const timer = setTimeout(() => setIsDone(true), DURATION_MS);
    return () => clearTimeout(timer);
  }, [isReduced, elapsedMs]);

  if (isReduced || isDone) return null;

  return (
    <View
      aria-hidden
      style={[StyleSheet.absoluteFill, { pointerEvents: "none", zIndex: 6 }]}
    >
      <View style={{ position: "absolute", left: "50%", top: ORIGIN_Y }}>
        {pieces.map((piece, index) => (
          <PieceView key={index} piece={piece} elapsedMs={elapsedMs} />
        ))}
      </View>
    </View>
  );
}
