import { useEffect, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

const SCRIM_COLOR = "rgba(0, 0, 0, 0.5)";
const SCRIM_FADE_MS = 200;
const SLIDE_MS = 340;
const SLIDE_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);
/** Used until the sheet reports its real height, so it starts fully off-screen. */
const SLIDE_FALLBACK_DISTANCE = 500;
const SHEET_RADIUS = 28;
const MIN_BOTTOM_INSET = 16;
const BOTTOM_EXTRA = 18;

type BodyProps = { onClose: () => void; children: ReactNode };

function BottomSheetBody({ onClose, children }: BodyProps) {
  const { bottom } = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const scrimOpacity = useSharedValue(0);
  const slide = useSharedValue(0);
  const sheetHeight = useSharedValue(SLIDE_FALLBACK_DISTANCE);

  useEffect(() => {
    if (reducedMotion) {
      scrimOpacity.set(1);
      slide.set(1);
      return;
    }
    scrimOpacity.set(withTiming(1, { duration: SCRIM_FADE_MS, easing: Easing.out(Easing.ease) }));
    slide.set(withTiming(1, { duration: SLIDE_MS, easing: SLIDE_EASING }));
  }, [reducedMotion, scrimOpacity, slide]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.get() }));
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - slide.get()) * sheetHeight.get() }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    sheetHeight.set(event.nativeEvent.layout.height);
  };

  return (
    <View className="flex-1 justify-end">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM_COLOR }, scrimStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        onLayout={handleLayout}
        style={[
          {
            backgroundColor: colors.bg,
            borderTopLeftRadius: SHEET_RADIUS,
            borderTopRightRadius: SHEET_RADIUS,
          },
          slideStyle,
        ]}
      >
        <View
          className="px-5 pt-[10px]"
          style={{ paddingBottom: Math.max(bottom, MIN_BOTTOM_INSET) + BOTTOM_EXTRA }}
        >
          <View aria-hidden className="mb-[18px] h-[5px] w-[38px] self-center rounded-[3px] bg-line" />
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

/** Bottom sheet over a dimmed scrim. Tap the scrim or press back to close. */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {/* Mounted per open so the slide-up replays every time. */}
      {visible ? <BottomSheetBody onClose={onClose}>{children}</BottomSheetBody> : null}
    </Modal>
  );
}
