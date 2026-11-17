import { useEffect } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PEOPLE, personInitials } from "@/features/send/people";
import { announce } from "@/lib/announce";
import { useBannerStore } from "@/stores/banner-store";
import { colors } from "@/theme/colors";

import { Logo } from "./logo";
import { PersonAvatar } from "./person-avatar";
import { Text } from "./text";

const SHOW_MS = 400;
const FADE_MS = 200;
const VISIBLE_MS = 5000;
const SIDE_MARGIN = 12;
const TOP_GAP = 8;
const FALLBACK_HEIGHT = 110;
const HIDDEN_FACTOR = 1.5;
const LOGO_SIZE = 18;
const AVATAR_SIZE = 40;
const FALLBACK_INITIALS = "MC";
/** colors.surface at 92% alpha (no blur dependency). */
const CARD_BG = `${colors.surface}EB`;
const CARD_Z = 45;

/** Mount once at the root. Drive it with `showBanner(...)`. */
export function BannerHost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const id = useBannerStore((state) => state.id);
  const banner = useBannerStore((state) => state.banner);
  const isVisible = useBannerStore((state) => state.isVisible);
  const hide = useBannerStore((state) => state.hide);
  const progress = useSharedValue(0);
  const cardHeight = useSharedValue(FALLBACK_HEIGHT);

  useEffect(() => {
    if (!isVisible) {
      progress.set(withTiming(0, { duration: FADE_MS }));
      return;
    }
    progress.set(withTiming(1, { duration: SHOW_MS, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
    if (banner) announce(`${banner.title}. ${banner.subtitle}`);
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
    // `id` restarts the timer when a new banner arrives while one is showing.
  }, [id, isVisible, banner, hide, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (progress.get() - 1) * cardHeight.get() * HIDDEN_FACTOR }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    cardHeight.set(event.nativeEvent.layout.height);
  };

  const handlePress = () => {
    hide();
    router.navigate("/activity");
  };

  if (!banner) return null;
  const person = PEOPLE[banner.personKey];
  const initials = person ? personInitials(person) : FALLBACK_INITIALS;

  return (
    <Animated.View
      aria-hidden={!isVisible}
      onLayout={handleLayout}
      style={[
        {
          position: "absolute",
          top: insets.top + TOP_GAP,
          left: SIDE_MARGIN,
          right: SIDE_MARGIN,
          zIndex: CARD_Z,
          elevation: CARD_Z,
          pointerEvents: isVisible ? "auto" : "none",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: CARD_BG,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.4,
          shadowRadius: 18,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
        accessibilityHint="Opens your activity"
        onPress={handlePress}
        className="gap-[6px] px-[14px] pb-3 pt-[10px]"
      >
        <View className="flex-row items-center gap-[7px]">
          <Logo size={LOGO_SIZE} />
          <Text className="font-text-semibold text-[12px] uppercase tracking-[0.48px] text-ink-2">
            MoriCash
          </Text>
          <Text className="ml-auto font-text-medium text-[12px] text-ink-3">now</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <PersonAvatar initials={initials} size={AVATAR_SIZE} />
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-text-semibold text-[14px]">
              {banner.title}
            </Text>
            <Text numberOfLines={1} className="mt-px text-[13px] text-ink-2">
              {banner.subtitle}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
