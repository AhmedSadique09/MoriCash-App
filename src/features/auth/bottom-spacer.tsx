import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MIN_BOTTOM = 16;
const EXTRA_BOTTOM = 4;

/**
 * Space under a bottom-pinned keypad. Same formula as `Footer`, so the last key
 * row clears the Android 3-button nav bar (edge-to-edge) and the iOS home indicator.
 */
export function BottomSpacer() {
  const insets = useSafeAreaInsets();

  return <View style={{ height: Math.max(insets.bottom, MIN_BOTTOM) + EXTRA_BOTTOM }} />;
}
