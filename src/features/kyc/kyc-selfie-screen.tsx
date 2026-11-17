import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useOnboardingStore, type SelfieState } from "@/stores/onboarding-store";

import { FaceOval } from "./face-oval";
import { CameraShell } from "./kyc-capture-screen";
import { ShutterButton } from "./shutter-button";

const SCAN_DURATION_MS = 2600;
const SCAN_DURATION_REDUCED_MS = 300;

const HINTS: Record<SelfieState, string> = {
  ready:
    "Fit your face inside the circle. Take off glasses and hats, and face the light.",
  scanning: "Hold still and look at the screen…",
  done: "Selfie done.",
};

export function KycSelfieScreen() {
  const router = useRouter();
  const isReducedMotion = useReducedMotion();
  const selfie = useOnboardingStore((state) => state.kyc.selfie);
  const setSelfie = useOnboardingStore((state) => state.setSelfie);

  useEffect(() => {
    if (selfie !== "scanning") return;
    const timer = setTimeout(
      () => setSelfie("done"),
      isReducedMotion ? SCAN_DURATION_REDUCED_MS : SCAN_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [selfie, isReducedMotion, setSelfie]);

  return (
    <CameraShell title="Take a selfie">
      <View className="mt-[48px] items-center">
        <FaceOval state={selfie} />
      </View>

      <Text
        accessibilityLiveRegion="polite"
        className="mx-[10px] mt-[26px] text-center leading-[22.5px] text-ink-2"
      >
        {HINTS[selfie]}
      </Text>

      {selfie === "ready" ? (
        <View className="mt-auto items-center">
          <ShutterButton
            label="Take selfie"
            onPress={() => setSelfie("scanning")}
          />
        </View>
      ) : null}

      {selfie === "done" ? (
        <View className="mt-auto gap-[10px]">
          <Button label="Continue" onPress={() => router.push("/kyc/review")} />
          <Button
            label="Retake"
            variant="sec"
            onPress={() => setSelfie("ready")}
          />
        </View>
      ) : null}
    </CameraShell>
  );
}
