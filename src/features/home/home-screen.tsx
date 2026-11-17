import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { ListGroup } from "@/components/ui/list";
import { Screen } from "@/components/ui/screen";
import { SectionHead } from "@/components/ui/section-head";
import { Text } from "@/components/ui/text";
import { EmptyActivity, TxRow } from "@/components/ui/tx-row";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { startScan, startSend } from "@/features/send/start-send";
import { personInitials } from "@/features/send/people";
import { simulateIncoming } from "@/features/wallet/simulate-incoming";
import { fullPhone } from "@/lib/phone";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useWalletStore } from "@/stores/wallet-store";

import { HeroCard } from "./hero-card";
import { QuickActions } from "./quick-actions";
import { StartCard } from "./start-card";

const RECENT_COUNT = 4;
const AVATAR_SIZE = 42;

type HomeHeaderProps = {
  firstName: string;
  initials: string;
  hasUnread: boolean;
  onOpenAccount: () => void;
  onOpenNotifications: () => void;
};

function HomeHeader({
  firstName,
  initials,
  hasUnread,
  onOpenAccount,
  onOpenNotifications,
}: HomeHeaderProps) {
  return (
    <View className="flex-row items-center justify-between pt-[6px]">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={onOpenAccount}
          className="active:opacity-70"
        >
          <PersonAvatar initials={initials} size={AVATAR_SIZE} tone="me" />
        </Pressable>
        <View>
          <Text className="text-[12px] leading-[17px] text-ink-3">
            Good evening
          </Text>
          <Text className="font-text-semibold text-[17px]">{firstName}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasUnread ? "Notifications, unread" : "Notifications"}
        onPress={onOpenNotifications}
        className="h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface active:opacity-70"
      >
        <Icon name="bell" size={20} />
        {hasUnread ? (
          <View
            className="absolute right-[8px] top-[7px] h-3 w-3 items-center justify-center rounded-full bg-surface"
            style={{ pointerEvents: "none" }}
          >
            <View className="h-2 w-2 rounded-full bg-neg" />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

type PrototypeButtonProps = { label: string; onPress: () => void };

/** Demo-only action, drawn dashed so it never reads as product UI. */
function PrototypeButton({ label, onPress }: PrototypeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="mt-[14px] h-[44px] items-center justify-center rounded-xl border-[1.5px] border-dashed border-ink-3 active:opacity-60"
    >
      <Text className="font-text-medium text-[14px] text-ink-2">{label}</Text>
    </Pressable>
  );
}

/** Home tab: balance hero, quick actions, start card and recent activity. */
export function HomeScreen() {
  const router = useRouter();
  const user = useOnboardingStore((s) => s.user);
  const tier = useOnboardingStore((s) => s.tier);
  const balanceUsdt = useWalletStore((s) => s.balanceUsdt);
  const isHidden = useWalletStore((s) => s.isHidden);
  const hasUnread = useWalletStore((s) => s.hasUnread);
  const txs = useWalletStore((s) => s.txs);
  const toggleHidden = useWalletStore((s) => s.toggleHidden);

  const recent = txs.slice(0, RECENT_COUNT);
  const hasSentTx = txs.some((tx) => tx.type === "sent");
  const phoneLabel = user ? fullPhone(user.cc, user.num) : "No number yet";

  const openTx = (id: string) =>
    router.push({ pathname: "/tx/[id]", params: { id } });

  return (
    <Screen>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pt-1 pb-7"
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          firstName={user?.first || "there"}
          initials={user ? personInitials(user) : "M"}
          hasUnread={hasUnread}
          onOpenAccount={() => router.navigate("/account")}
          onOpenNotifications={() => router.push("/notifications")}
        />
        <HeroCard
          balanceUsdt={balanceUsdt}
          isHidden={isHidden}
          country={user?.country ?? "JP"}
          phoneLabel={phoneLabel}
          onToggleHidden={toggleHidden}
          onMyCode={() => router.push("/receive")}
        />
        <QuickActions
          onSend={() => startSend(router)}
          onScan={() => startScan(router)}
          onReceive={() => router.push("/receive")}
        />
        <StartCard
          tier={tier}
          hasSentTx={hasSentTx}
          onVerify={() => router.push("/kyc/intro")}
          onSendByPhone={() => startSend(router)}
          onScan={() => startScan(router)}
        />
        <View className="mt-7">
          <SectionHead
            title="Recent activity"
            actionLabel={txs.length ? "See all" : undefined}
            onAction={() => router.navigate("/activity")}
          />
          <ListGroup>
            {recent.length ? (
              recent.map((tx, index) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  isHidden={isHidden}
                  onPress={openTx}
                  isLast={index === recent.length - 1}
                />
              ))
            ) : (
              <EmptyActivity />
            )}
          </ListGroup>
        </View>
        {tier === 1 ? (
          <PrototypeButton
            label="Prototype: someone sends you USDT"
            onPress={simulateIncoming}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
