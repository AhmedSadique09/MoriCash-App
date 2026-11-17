import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";

import { BrandMini } from "@/components/ui/brand-mini";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useSettingsStore } from "@/stores/settings-store";
import { toast } from "@/stores/toast-store";

import { SlideDots } from "./slide-dots";
import { SLIDES } from "./slides";

const ART_MIN_HEIGHT = 220;
const ART_MAX_HEIGHT = 318;
const ART_HEIGHT_RATIO = 0.375;
/** The chip is 36pt tall; 4pt each side reaches the 44pt minimum target. */
const CHIP_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

type LanguageChipProps = {
  lang: string;
  onPress: () => void;
};

function LanguageChip({ lang, onPress }: LanguageChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Language: ${lang}`}
      hitSlop={CHIP_HIT_SLOP}
      onPress={onPress}
      className="h-9 flex-row items-center gap-1.5 rounded-full bg-surface-2 px-3"
    >
      <Icon name="globe" size={16} />
      <Text className="font-text-semibold text-[14px]">{lang}</Text>
    </Pressable>
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const lang = useSettingsStore((state) => state.lang);
  const cycleLanguage = useSettingsStore((state) => state.cycleLanguage);
  const { height } = useWindowDimensions();

  const artHeight = Math.round(
    Math.min(ART_MAX_HEIGHT, Math.max(ART_MIN_HEIGHT, height * ART_HEIGHT_RATIO)),
  );
  const { title, body, Art } = SLIDES[slideIndex];

  const handleNextSlide = () => setSlideIndex((i) => (i + 1) % SLIDES.length);

  const handleCreateAccount = () => {
    resetOnboarding();
    router.push("/signup");
  };

  const handleLanguage = () => {
    const next = cycleLanguage();
    if (next !== "EN") {
      toast(`${next} copy comes in the next build. Showing English for now.`);
    }
  };

  return (
    <Screen>
      <View className="h-[52px] flex-row items-center justify-between px-5">
        <BrandMini />
        <LanguageChip lang={lang} onPress={handleLanguage} />
      </View>

      <View className="flex-1 px-5 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next slide"
          onPress={handleNextSlide}
          style={{ height: artHeight }}
          className="mt-1.5 w-full items-center justify-center overflow-hidden rounded-[28px] border border-line bg-surface"
        >
          <Art />
        </Pressable>

        <Text
          accessibilityRole="header"
          className="mb-2 mt-[22px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          {title}
        </Text>
        <Text className="leading-[22px] text-ink-2">{body}</Text>

        <SlideDots
          count={SLIDES.length}
          activeIndex={slideIndex}
          onSelect={setSlideIndex}
        />
      </View>

      <Footer>
        <Button label="Create account" onPress={handleCreateAccount} />
        <Button
          label="I already have an account"
          variant="sec"
          onPress={() => router.push("/login")}
        />
      </Footer>
    </Screen>
  );
}
