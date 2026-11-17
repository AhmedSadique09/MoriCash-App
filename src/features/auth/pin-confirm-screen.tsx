import { useRouter } from "expo-router";

import { useOnboardingStore } from "@/stores/onboarding-store";

import { LinkButton } from "./link-button";
import { PinEntryLayout, usePinEntry } from "./pin-create-screen";

const MISMATCH_ERROR = "Those PINs don't match. Try again.";

export function PinConfirmScreen() {
  const router = useRouter();
  const newPin = useOnboardingStore((state) => state.newPin);

  const { pin, error, shakeKey, handleKey } = usePinEntry((value) => {
    if (value !== newPin) return MISMATCH_ERROR;
    router.push("/biometrics");
    return null;
  });

  return (
    <PinEntryLayout
      title="Enter your PIN again"
      subtitle="Type it once more to confirm."
      pin={pin}
      error={error}
      shakeKey={shakeKey}
      onKey={handleKey}
    >
      <LinkButton label="Start over" onPress={() => router.back()} className="self-center" />
    </PinEntryLayout>
  );
}
