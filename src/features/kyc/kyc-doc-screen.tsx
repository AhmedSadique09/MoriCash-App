import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ListGroup, RadioRow } from "@/components/ui/list";
import { Note } from "@/components/ui/note";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import {
  COUNTRY_NAMES,
  DOCS,
  useOnboardingStore,
} from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

const FALLBACK_COUNTRY = "JP";
const DOC_NOTE =
  "Use an original document that hasn't expired. Photocopies and screenshots aren't accepted.";

type IconCircleProps = {
  size: number;
  children: ReactNode;
};

function IconCircle({ size, children }: IconCircleProps) {
  return (
    <View
      className="items-center justify-center rounded-full bg-surface-2"
      style={{ width: size, height: size }}
    >
      {children}
    </View>
  );
}

export function KycDocScreen() {
  const router = useRouter();
  const country = useOnboardingStore((s) => s.user?.country ?? FALLBACK_COUNTRY);
  const selectedDoc = useOnboardingStore((s) => s.kyc.doc);
  const setKycDoc = useOnboardingStore((s) => s.setKycDoc);
  const setShot = useOnboardingStore((s) => s.setShot);
  const docs = DOCS[country];

  const handleContinue = () => {
    setShot("front", false);
    setShot("back", false);
    router.push({ pathname: "/kyc/capture", params: { side: "front" } });
  };

  return (
    <Screen>
      <ObBar step={1} total={3} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <Text
          accessibilityRole="header"
          className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          Which ID will you use?
        </Text>
        <Card className="mt-[14px] flex-row items-center gap-3 py-3">
          <IconCircle size={34}>
            <Icon name="globe" size={18} />
          </IconCircle>
          <View className="flex-1">
            <Text className="text-[12px] leading-[17px] text-ink-3">Issued in</Text>
            <Text className="font-text-semibold">{COUNTRY_NAMES[country]}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change country of issue"
            hitSlop={8}
            onPress={() => toast("Not part of this prototype yet")}
            className="py-[6px]"
          >
            <Text className="font-text-semibold text-[14px] text-sky">Change</Text>
          </Pressable>
        </Card>
        <ListGroup className="mt-3">
          {docs.map((doc, index) => (
            <RadioRow
              key={doc.id}
              label={doc.name}
              sublabel={doc.hint}
              leading={
                <IconCircle size={40}>
                  <Icon name="idcard" size={20} />
                </IconCircle>
              }
              selected={doc.id === selectedDoc}
              onPress={() => setKycDoc(doc.id)}
              isLast={index === docs.length - 1}
            />
          ))}
        </ListGroup>
        <Note icon="info" className="mt-[14px]">
          {DOC_NOTE}
        </Note>
      </ScrollView>
      <Footer>
        <Button label="Continue" disabled={!selectedDoc} onPress={handleContinue} />
      </Footer>
    </Screen>
  );
}
