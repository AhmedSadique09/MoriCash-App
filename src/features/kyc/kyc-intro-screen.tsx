import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Note } from "@/components/ui/note";
import { Pill } from "@/components/ui/pill";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { PlainBar } from "@/components/ui/top-bar";
import { resetTo } from "@/lib/navigation";
import {
  COUNTRY_NAMES,
  DOCS,
  useOnboardingStore,
  type Country,
} from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

const FALLBACK_COUNTRY: Country = "JP";

const CAPTION_DOC_COUNT = 3;

// Lowercase a document name mid-sentence unless it carries its own capitals
// (PhilSys national ID, My Number card, UMID card).
function lowerIfPlain(name: string): string {
  return /[A-Z]/.test(name.slice(1)) ? name : name.charAt(0).toLowerCase() + name.slice(1);
}

/** "Passport, residence card or driver's licence" for Japan; PH lists its own IDs. */
function buildDocsCaption(country: Country): string {
  const names = DOCS[country].slice(0, CAPTION_DOC_COUNT).map((doc) => doc.name);
  const head = names.slice(0, -1).map((name, i) => (i === 0 ? name : lowerIfPlain(name)));
  const last = lowerIfPlain(names[names.length - 1]);
  return `${head.join(", ")} or ${last}`;
}

function buildSteps(country: Country) {
  return [
    { title: "Take a photo of your ID", caption: buildDocsCaption(country) },
    { title: "Take a quick selfie", caption: "So we know the ID is yours" },
    { title: "We check it", caption: "Usually in under 5 minutes" },
  ];
}

type NumberedStepProps = {
  index: number;
  title: string;
  caption: string;
};

function NumberedStep({ index, title, caption }: NumberedStepProps) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-[28px] w-[28px] items-center justify-center rounded-full bg-surface-2">
        <Text className="font-text-semibold text-[13px]">{index + 1}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-text-semibold text-[15px]">{title}</Text>
        <Text className="text-[12px] leading-[17px] text-ink-3">{caption}</Text>
      </View>
    </View>
  );
}

export function KycIntroScreen() {
  const router = useRouter();
  const country = useOnboardingStore((s) => s.user?.country ?? FALLBACK_COUNTRY);
  const resetKyc = useOnboardingStore((s) => s.resetKyc);
  const patchForm = useOnboardingStore((s) => s.patchForm);

  const handleStart = () => {
    resetKyc();
    patchForm({ consent: false });
    router.push("/kyc/doc");
  };

  const handleLater = () => {
    resetTo(router, "/home");
    toast("You can verify any time from Home.");
  };

  return (
    <Screen>
      <PlainBar />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <Pill label="Account created" tone="pos" icon="check" className="mt-[6px]" />
        <Text
          accessibilityRole="header"
          className="mb-2 mt-[14px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          {"Now, let's verify your identity"}
        </Text>
        <Text className="leading-[22px] text-ink-2">
          {`The law in ${COUNTRY_NAMES[country]} requires this before you can send money. It takes about 3 minutes.`}
        </Text>
        <View className="mb-[18px] mt-6 gap-[14px]">
          {buildSteps(country).map((step, index) => (
            <NumberedStep
              key={step.title}
              index={index}
              title={step.title}
              caption={step.caption}
            />
          ))}
        </View>
        <Note icon="lock">Your documents are encrypted and used only to verify you.</Note>
      </ScrollView>
      <Footer>
        <Button label="Start verification" onPress={handleStart} />
        <Button label="Do it later" variant="ghost" onPress={handleLater} />
      </Footer>
    </Screen>
  );
}
