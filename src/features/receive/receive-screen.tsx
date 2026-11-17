import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Note } from "@/components/ui/note";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { QrCode } from "@/components/ui/qr-code";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { personInitials } from "@/features/send/people";
import { startScan } from "@/features/send/start-send";
import { simulateIncoming } from "@/features/wallet/simulate-incoming";
import { fullPhone } from "@/lib/phone";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { toast } from "@/stores/toast-store";
import { colors } from "@/theme/colors";

const FALLBACK_USER = {
  first: "Haruki",
  last: "Morita",
  name: "Haruki Morita",
  cc: "+81",
  num: "9011112222",
} as const;

const QR_SIZE = 232;
const AVATAR_SIZE = 52;
const GLOW_HEIGHT = 130;
const GLOW_OPACITY = 0.75;
// Same hue as sun-soft, fully transparent, so the gradient fades without a gray band.
const GLOW_FADE = "rgba(44,38,8,0)";

function ScanIconButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scan a code"
      hitSlop={2}
      onPress={onPress}
      className="h-[40px] w-[40px] items-center justify-center rounded-[12px] active:bg-surface-2"
    >
      <Icon name="scan" size={20} />
    </Pressable>
  );
}

type MyCodeCardProps = {
  name: string;
  initials: string;
  phone: string;
  seed: string;
  isVerified: boolean;
};

function MyCodeCard({ name, initials, phone, seed, isVerified }: MyCodeCardProps) {
  return (
    <View className="mt-[6px] overflow-hidden rounded-[28px] border border-line bg-surface p-5">
      <LinearGradient
        colors={[colors["sun-soft"], GLOW_FADE]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: GLOW_HEIGHT,
          opacity: GLOW_OPACITY,
        }}
      />
      <View className="flex-row items-center gap-3">
        <PersonAvatar initials={initials} size={AVATAR_SIZE} tone="me" />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center">
            <Text
              numberOfLines={1}
              className="shrink font-text-semibold text-[17px]"
            >
              {name}
            </Text>
            {isVerified ? <VerifiedBadge /> : null}
          </View>
          <Text
            className="mt-px text-[13.5px] text-ink-2"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {phone}
          </Text>
        </View>
      </View>
      <View className="mt-[18px] items-center">
        <QrCode seed={seed} size={QR_SIZE} />
      </View>
      <Text className="mt-[14px] text-center text-[13.5px] text-ink-2">
        Scan with MoriCash to send me USDT
      </Text>
    </View>
  );
}

function PrototypeButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Prototype: someone sends you USDT"
      onPress={onPress}
      className="mt-4 h-[44px] items-center justify-center rounded-xl border-[1.5px] border-dashed border-ink-3 active:bg-surface-2"
    >
      <Text className="font-text-medium text-[14px] text-ink-2">
        Prototype: someone sends you USDT
      </Text>
    </Pressable>
  );
}

export function ReceiveScreen() {
  const router = useRouter();
  const user = useOnboardingStore((state) => state.user);
  const tier = useOnboardingStore((state) => state.tier);

  const person = user ?? FALLBACK_USER;
  const phone = fullPhone(person.cc, person.num);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(`${person.cc} ${person.num}`);
      toast("Copied");
    } catch {
      toast("Couldn't copy the number");
    }
  };

  return (
    <Screen>
      <TopBar
        title="Receive USDT"
        right={<ScanIconButton onPress={() => startScan(router)} />}
      />
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pt-1 pb-7"
        showsVerticalScrollIndicator={false}
      >
        <MyCodeCard
          name={person.name}
          initials={personInitials(person)}
          phone={phone}
          seed={`mc:${person.cc}${person.num}`}
          isVerified={tier === 1}
        />
        <View className="mt-[14px] flex-row gap-[10px]">
          <View className="flex-1">
            <Button
              label="Share code"
              variant="sec"
              icon="share"
              onPress={() =>
                toast("Opens the share sheet with your code and number")
              }
            />
          </View>
          <View className="flex-1">
            <Button
              label="Copy number"
              variant="sec"
              icon="copy"
              onPress={handleCopy}
            />
          </View>
        </View>
        <Note icon="shield" className="mt-[14px]">
          When someone verifies your number or code, they see your name and that
          you&apos;re verified. They never see your balance or email.
        </Note>
        <PrototypeButton onPress={simulateIncoming} />
      </ScrollView>
    </Screen>
  );
}
