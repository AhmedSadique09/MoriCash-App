import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/check-row";
import { DetailList } from "@/components/ui/detail-list";
import { Pill } from "@/components/ui/pill";
import { Footer, Screen } from "@/components/ui/screen";
import { SectionHead } from "@/components/ui/section-head";
import { Text } from "@/components/ui/text";
import { ObBar } from "@/components/ui/top-bar";
import { resetTo } from "@/lib/navigation";
import {
  COUNTRY_NAMES,
  docInfo,
  useOnboardingStore,
  type User,
} from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";

// Direct entry (no signup yet) falls back to the prototype's demo user.
const FALLBACK_USER: User = {
  first: "Haruki",
  last: "Morita",
  name: "Haruki Morita",
  email: "haruki.morita@example.com",
  country: "JP",
  dob: "14/03/1991",
  cc: "+81",
  num: "9011112222",
};

const CONSENT_COPY =
  "I confirm these details are correct, and I agree to MoriCash and its verification partner checking them.";

function showSoon() {
  toast("Not part of this prototype yet");
}

function buildDetailRows(user: User) {
  return [
    { label: "Full name", value: user.name },
    { label: "Date of birth", value: user.dob },
    { label: "Lives in", value: COUNTRY_NAMES[user.country] },
    { label: "Email", value: user.email },
  ];
}

function buildDocumentRows(user: User, docName: string, hasTwoSides: boolean) {
  return [
    { label: "ID", value: docName },
    { label: "Issued in", value: COUNTRY_NAMES[user.country] },
    {
      label: "Photos",
      value: (
        <Pill
          label={hasTwoSides ? "Front and back" : "Photo page"}
          tone="pos"
          icon="check"
        />
      ),
    },
    {
      label: "Selfie",
      value: <Pill label="Done" tone="pos" icon="check" />,
    },
  ];
}

export function KycReviewScreen() {
  const router = useRouter();
  const user = useOnboardingStore((s) => s.user) ?? FALLBACK_USER;
  const docId = useOnboardingStore((s) => s.kyc.doc);
  const consent = useOnboardingStore((s) => s.form.consent);
  const patchForm = useOnboardingStore((s) => s.patchForm);
  const submitKyc = useOnboardingStore((s) => s.submitKyc);
  const doc = docInfo(user.country, docId);

  const handleSubmit = () => {
    submitKyc();
    resetTo(router, "/kyc/pending");
  };

  return (
    <Screen>
      <ObBar step={3} total={3} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <Text
          accessibilityRole="header"
          className="mb-2 mt-[10px] font-display text-[27px] leading-[31px] tracking-[-0.54px]"
        >
          Check and submit
        </Text>
        <Text className="leading-[22px] text-ink-2">
          Make sure everything matches your ID.
        </Text>
        <SectionHead
          title="Your details"
          actionLabel="Edit"
          onAction={showSoon}
          className="mt-[22px]"
        />
        <DetailList rows={buildDetailRows(user)} />
        <SectionHead title="Your documents" className="mt-[22px]" />
        <DetailList rows={buildDocumentRows(user, doc.name, doc.hasTwoSides)} />
        <CheckboxRow
          checked={consent}
          onChange={(value) => patchForm({ consent: value })}
        >
          {CONSENT_COPY}
        </CheckboxRow>
      </ScrollView>
      <Footer>
        <Button
          label="Submit for review"
          disabled={!consent}
          onPress={handleSubmit}
        />
      </Footer>
    </Screen>
  );
}
