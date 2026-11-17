import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { ScrollView } from "react-native";

import { Button } from "@/components/ui/button";
import type { FaceIdFlag } from "@/interfaces/auth.interface";
import { Footer, Screen } from "@/components/ui/screen";
import { StatusRing } from "@/components/ui/status-ring";
import { Text } from "@/components/ui/text";
import { PlainBar } from "@/components/ui/top-bar";
import { authService } from "@/services/auth.service";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

const RING_ICON_SIZE = 60;
const FACE_ON_DELAY_MS = 700;
const SAVE_CHOICE_ERROR =
  "Couldn't save your Face ID choice. You can change it in Account.";

/** Tells the backend about the choice (1 = Turn on, 0 = Not now) without holding up the screen. */
function saveFaceIdChoice(faceId: FaceIdFlag): void {
  authService.setBiometrics(faceId).catch(() => toast(SAVE_CHOICE_ERROR));
}

export function BiometricsScreen() {
  const router = useRouter();
  const setFaceId = useOnboardingStore((state) => state.setFaceId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True once /kyc/intro has been pushed. This screen stays mounted underneath,
  // so unmount cleanup never runs and a repeat tap would push a second copy.
  const hasPushedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  // Coming back (e.g. Android back from the intro) makes the buttons usable again.
  useFocusEffect(
    useCallback(() => {
      hasPushedRef.current = false;
    }, []),
  );

  const goToIntro = () => {
    hasPushedRef.current = true;
    router.push("/kyc/intro");
  };

  const handleTurnOn = () => {
    // A second tap while the toast is showing must not queue another navigation.
    if (timerRef.current !== null || hasPushedRef.current) return;
    setFaceId(true);
    toast("Face ID is on");
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      // Saved together with the navigation, so "Not now" within the delay
      // cancels it and only one choice ever reaches the backend.
      saveFaceIdChoice(1);
      goToIntro();
    }, FACE_ON_DELAY_MS);
  };

  const handleNotNow = () => {
    if (hasPushedRef.current) return;
    // Cancels a pending "Turn on" so only one navigation happens.
    clearTimer();
    setFaceId(false);
    saveFaceIdChoice(0);
    goToIntro();
  };

  return (
    <Screen>
      <PlainBar />
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="items-center pt-[44px] pb-7"
      >
        <StatusRing
          icon="face"
          tone="neu"
          size="big"
          pulse
          iconSize={RING_ICON_SIZE}
        />
        <Text
          accessibilityRole="header"
          className="text-center font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          Unlock with Face ID
        </Text>
        <Text className="my-[15px] max-w-[300px] text-center leading-[22px] text-ink-2">
          Open the app and approve transfers with your face instead of typing
          your PIN. You can turn this off in Account.
        </Text>
      </ScrollView>
      <Footer>
        <Button label="Turn on Face ID" onPress={handleTurnOn} />
        <Button
          label="Not now"
          variant="ghost"
          onPress={handleNotNow}
        />
      </Footer>
    </Screen>
  );
}
