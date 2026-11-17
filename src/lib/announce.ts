import { AccessibilityInfo } from "react-native";

/**
 * Speaks `message` through the active screen reader (VoiceOver / TalkBack).
 * `accessibilityLiveRegion` is Android-only and `role="alert"` is ignored by
 * iOS, so this is the one cross-platform way to announce errors and toasts.
 */
export function announce(message: string): void {
  if (!message) return;
  AccessibilityInfo.announceForAccessibility(message);
}
