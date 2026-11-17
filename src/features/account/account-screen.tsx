import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { IconCircle } from "@/components/ui/icon-circle";
import { ListGroup } from "@/components/ui/list";
import { ListRow } from "@/components/ui/list-row";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Pill } from "@/components/ui/pill";
import { Screen } from "@/components/ui/screen";
import { SectionHead } from "@/components/ui/section-head";
import { Segmented } from "@/components/ui/segmented";
import { Text } from "@/components/ui/text";
import { personInitials } from "@/features/send/people";
import { SEND_LIMIT, sendLeft } from "@/features/send/send-logic";
import { fmt } from "@/lib/format";
import { resetTo } from "@/lib/navigation";
import { fullPhone } from "@/lib/phone";
import {
  type Tier,
  type User,
  useOnboardingStore,
} from "@/stores/onboarding-store";
import { useSettingsStore } from "@/stores/settings-store";
import { toast } from "@/stores/toast-store";
import { useWalletStore } from "@/stores/wallet-store";

const COMING_SOON = "Not part of this prototype yet";
const LIGHT_MODE_MESSAGE = "Light mode isn't part of this build yet";

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

type ThemeMode = "system" | "light" | "dark";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function comingSoon() {
  toast(COMING_SOON);
}

function TierPill({ tier }: { tier: Tier }) {
  if (tier === 1) {
    return <Pill tone="pos" icon="check" label="Verified · Tier 1" />;
  }
  return <Pill tone="warn" label={tier === "pending" ? "ID in review" : "Not verified"} />;
}

type ProfileCardProps = { user: User; tier: Tier };

function ProfileCard({ user, tier }: ProfileCardProps) {
  const router = useRouter();

  return (
    <Card className="mt-4 flex-row items-center gap-[14px]">
      <PersonAvatar initials={personInitials(user)} size={52} tone="me" />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-text-semibold text-[17px]">
          {user.name}
        </Text>
        {user.num ? (
          <Text className="text-[12px] leading-[17px] text-ink-3">
            {fullPhone(user.cc, user.num)}
          </Text>
        ) : null}
        <Text numberOfLines={1} className="text-[12px] leading-[17px] text-ink-3">
          {user.email}
        </Text>
        <View className="mt-[6px]">
          <TierPill tier={tier} />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="My code"
        onPress={() => router.push("/receive")}
        className="h-10 w-10 items-center justify-center rounded-[12px] border border-line bg-surface active:opacity-60"
      >
        <Icon name="qr" size={20} />
      </Pressable>
    </Card>
  );
}

function VerifyCard() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Verify your identity. Needed to send money"
      onPress={() => router.push("/kyc/intro")}
      className="mt-[10px] flex-row items-center gap-[14px] rounded-[16px] border border-line bg-surface p-4 active:opacity-60"
    >
      <IconCircle icon="shield" />
      <View className="min-w-0 flex-1">
        <Text className="font-text-semibold">Verify your identity</Text>
        <Text className="text-[12px] leading-[17px] text-ink-3">Needed to send money</Text>
      </View>
      <Icon name="chevR" size={18} />
    </Pressable>
  );
}

type SectionProps = { title?: string; children: ReactNode };

function Section({ title, children }: SectionProps) {
  return (
    <View className="mt-7">
      {title ? <SectionHead title={title} /> : null}
      <ListGroup>{children}</ListGroup>
    </View>
  );
}

function SendingSection({ phone }: { phone: string }) {
  const sentToday = useWalletStore((state) => state.sentToday);
  const limitText = `${fmt(sendLeft(sentToday), 0)} of ${fmt(SEND_LIMIT, 0)} USDT left today`;

  return (
    <Section title="Sending">
      <ListRow
        leading={<IconCircle icon="gauge" />}
        title="Daily send limit"
        subtitle={limitText}
        showChevron
        onPress={comingSoon}
      />
      <ListRow
        leading={<IconCircle icon="phone" />}
        title="My MoriCash number"
        subtitle={phone}
        showChevron
        onPress={comingSoon}
        isLast
      />
    </Section>
  );
}

function SecuritySection() {
  const faceId = useOnboardingStore((state) => state.faceId);

  return (
    <Section title="Security">
      <ListRow
        leading={<IconCircle icon="shield" />}
        title="PIN and Face ID"
        subtitle={faceId ? "Face ID on" : "PIN only"}
        showChevron
        onPress={comingSoon}
      />
      <ListRow
        leading={<IconCircle icon="device" />}
        title="Devices"
        subtitle="iPhone 15 · this device"
        showChevron
        onPress={comingSoon}
        isLast
      />
    </Section>
  );
}

function AppearanceRow() {
  // The app is dark-only for now, so "Dark" is always the selected option.
  const handleChange = (mode: ThemeMode) => {
    if (mode !== "dark") toast(LIGHT_MODE_MESSAGE);
  };

  return (
    <View className="py-[14px]">
      <View className="mb-3 flex-row items-center gap-3">
        <IconCircle icon="sun" />
        <Text className="font-text-medium text-[16px]">Appearance</Text>
      </View>
      <Segmented options={THEME_OPTIONS} value="dark" onChange={handleChange} />
    </View>
  );
}

function PreferencesSection() {
  const cycleLanguage = useSettingsStore((state) => state.cycleLanguage);

  const handleLanguage = () => {
    const next = cycleLanguage();
    if (next !== "EN") {
      toast(`${next} copy comes in the next build. Showing English for now.`);
    }
  };

  return (
    <Section title="Preferences">
      <ListRow
        leading={<IconCircle icon="globe" />}
        title="Language"
        subtitle="English · 日本語 · Filipino"
        showChevron
        onPress={handleLanguage}
      />
      <AppearanceRow />
    </Section>
  );
}

function SupportSection() {
  const router = useRouter();

  const handleLogout = () => {
    toast("You are logged out");
    resetTo(router, "/welcome");
  };

  return (
    <Section>
      <ListRow
        leading={<IconCircle icon="help" />}
        title="Help and support"
        subtitle="Chat 9:00–21:00 JST, in 3 languages"
        showChevron
        onPress={comingSoon}
      />
      <ListRow
        leading={<IconCircle icon="logout" />}
        title="Log out"
        showChevron={false}
        onPress={handleLogout}
        isLast
      />
    </Section>
  );
}

export function AccountScreen() {
  const storedUser = useOnboardingStore((state) => state.user);
  const tier = useOnboardingStore((state) => state.tier);
  const user = storedUser ?? FALLBACK_USER;
  const phone = user.num ? fullPhone(user.cc, user.num) : "";

  return (
    <Screen>
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <Text
          accessibilityRole="header"
          className="mb-[2px] mt-[10px] font-display text-[30px] leading-[33px] tracking-[-0.75px]"
        >
          Account
        </Text>
        <ProfileCard user={user} tier={tier} />
        {tier === 0 ? <VerifyCard /> : null}
        <SendingSection phone={phone} />
        <SecuritySection />
        <PreferencesSection />
        <SupportSection />
      </ScrollView>
    </Screen>
  );
}
