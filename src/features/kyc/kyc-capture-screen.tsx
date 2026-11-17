import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { docInfo, useOnboardingStore } from "@/stores/onboarding-store";
import { colors } from "@/theme/colors";

import { CameraFrame } from "./camera-frame";
import { IdCardMock } from "./id-card-mock";
import { ShutterButton } from "./shutter-button";

type Side = "front" | "back";

const TOP_EXTRA_PADDING = 8;
const BOTTOM_MIN_PADDING = 36;
const BOTTOM_INSET_PADDING = 16;
const CHECK_LINES = [
  "Text is sharp and readable",
  "All 4 corners are in the frame",
  "No glare",
] as const;
const FALLBACK_NAME = { first: "Haruki", last: "Morita" } as const;
const FALLBACK_DOB = "14/03/1991";
// The back button is 40pt; 2pt on every side makes the touch target 44pt.
const BACK_HIT_SLOP = 2;

const startsWithCapital = (word: string): boolean => /^[A-Z]/.test(word);
const hasInnerCapital = (word: string): boolean => /[A-Z]/.test(word.slice(1));

/**
 * Lowercases a document name for mid-sentence use but keeps what is already a
 * proper noun or acronym: "PhilSys national ID", "UMID card", "My Number card",
 * while "Residence card" becomes "residence card".
 */
function formatDocNameForTitle(name: string): string {
  const words = name.split(" ");
  // A later capitalised word ("Number") makes the leading word ("My") part of the name too.
  const hasCapitalisedLaterWord = words.slice(1).some(startsWithCapital);

  return words
    .map((word, index) => {
      const isProper =
        hasInnerCapital(word) ||
        (startsWithCapital(word) && (index > 0 || hasCapitalisedLaterWord));
      return isProper ? word : word.toLowerCase();
    })
    .join(" ");
}

type CameraShellProps = {
  title: string;
  children: ReactNode;
};

/** Always-dark full-bleed camera chrome shared by the capture and selfie screens. */
export function CameraShell({ title, children }: CameraShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-bg px-5"
      style={{
        paddingTop: insets.top + TOP_EXTRA_PADDING,
        paddingBottom: Math.max(
          insets.bottom + BOTTOM_INSET_PADDING,
          BOTTOM_MIN_PADDING,
        ),
      }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={BACK_HIT_SLOP}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-[12px]"
        >
          <Icon name="chevL" />
        </Pressable>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="flex-1 text-center font-text-semibold text-[16px]"
        >
          {title}
        </Text>
        <View className="h-10 w-10" />
      </View>
      {children}
    </View>
  );
}

function CaptureChecks() {
  return (
    <View className="mt-[26px] gap-[10px]">
      {CHECK_LINES.map((line) => (
        <View key={line} className="flex-row items-center gap-[10px]">
          <Icon name="check" size={18} strokeWidth={2.5} color={colors.pos} />
          <Text>{line}</Text>
        </View>
      ))}
    </View>
  );
}

type IdleProps = {
  label: string;
  onSnap: () => void;
};

function CaptureIdle({ label, onSnap }: IdleProps) {
  return (
    <>
      <Text className="mx-[10px] mt-[26px] text-center leading-[22.5px] text-ink-2">
        {`Place the ${label.toLowerCase()} inside the frame on a dark, flat surface. Avoid glare and keep your fingers off the text.`}
      </Text>
      <View className="mt-auto items-center">
        <ShutterButton label="Take photo" onPress={onSnap} />
      </View>
    </>
  );
}

export function KycCaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ side?: string }>();
  const side: Side = params.side === "back" ? "back" : "front";

  const user = useOnboardingStore((state) => state.user);
  const kyc = useOnboardingStore((state) => state.kyc);
  const setShot = useOnboardingStore((state) => state.setShot);
  const setSelfie = useOnboardingStore((state) => state.setSelfie);

  const country = user?.country ?? "JP";
  const doc = docInfo(country, kyc.doc);
  const hasShot = kyc.shots[side];
  const label =
    doc.id === "passport" ? "Photo page" : side === "front" ? "Front" : "Back";
  const docName = formatDocNameForTitle(doc.name);
  const fullName =
    `${user?.last || FALLBACK_NAME.last} ${user?.first || FALLBACK_NAME.first}`.toUpperCase();

  const handleUsePhoto = () => {
    if (side === "front" && doc.hasTwoSides) {
      router.push({ pathname: "/kyc/capture", params: { side: "back" } });
      return;
    }
    setSelfie("ready");
    router.push("/kyc/selfie");
  };

  return (
    <CameraShell title={`${label} of your ${docName}`}>
      <View className="mt-[56px]">
        <CameraFrame hasShot={hasShot}>
          {hasShot ? (
            <IdCardMock
              side={side}
              docName={doc.name}
              fullName={fullName}
              dob={user?.dob || FALLBACK_DOB}
              country={country}
            />
          ) : null}
        </CameraFrame>
      </View>

      {hasShot ? (
        <>
          <CaptureChecks />
          <View className="mt-auto gap-[10px]">
            <Button label="Use this photo" onPress={handleUsePhoto} />
            <Button
              label="Retake"
              variant="sec"
              onPress={() => setShot(side, false)}
            />
          </View>
        </>
      ) : (
        <CaptureIdle label={label} onSnap={() => setShot(side, true)} />
      )}
    </CameraShell>
  );
}
