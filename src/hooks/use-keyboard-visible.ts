import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

// iOS reports the keyboard before it animates; Android only fires the Did* pair.
const SHOW_EVENT = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE_EVENT = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

/** True while the software keyboard is on screen. */
export function useKeyboardVisible(): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(SHOW_EVENT, () => setIsVisible(true));
    const hideSub = Keyboard.addListener(HIDE_EVENT, () => setIsVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return isVisible;
}
