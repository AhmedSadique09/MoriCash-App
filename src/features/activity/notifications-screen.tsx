import { useEffect, type ReactNode } from "react";
import { ScrollView, View } from "react-native";

import type { IconName } from "@/components/ui/icon-paths";
import { IconCircle } from "@/components/ui/icon-circle";
import { ListGroup } from "@/components/ui/list";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TopBar } from "@/components/ui/top-bar";
import {
  PEOPLE,
  personInitials,
  personName,
  type Person,
} from "@/features/send/people";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { fullPhone } from "@/lib/phone";
import { useOnboardingStore, type Tier } from "@/stores/onboarding-store";
import { useWalletStore, type Tx } from "@/stores/wallet-store";

const MAX_TX_NOTIFICATIONS = 6;

type NotificationItem = {
  id: string;
  person?: Person;
  icon?: IconName;
  title: string;
  subtitle: string;
  when: string;
};

function fromTx(tx: Tx): NotificationItem {
  const person = tx.whoKey ? PEOPLE[tx.whoKey] : undefined;

  if (tx.type === "sent" && person) {
    return {
      id: tx.id,
      person,
      title: `You sent ${fmt(-tx.amount)} USDT`,
      subtitle: `To ${personName(person)} · ${fullPhone(person.cc, person.num)}`,
      when: tx.whenLabel,
    };
  }
  if (tx.type === "received" && person) {
    return {
      id: tx.id,
      person,
      title: `${personName(person)} sent you ${fmt(tx.amount)} USDT`,
      subtitle: tx.note ? `“${tx.note}”` : "Added to your balance",
      when: tx.whenLabel,
    };
  }
  return {
    id: tx.id,
    icon: "plus",
    title: `${fmt(Math.abs(tx.amount))} USDT added`,
    subtitle: tx.sub ?? "",
    when: tx.whenLabel,
  };
}

function buildNotifications(
  txs: readonly Tx[],
  tier: Tier,
): NotificationItem[] {
  const items = txs.slice(0, MAX_TX_NOTIFICATIONS).map(fromTx);
  if (tier !== 1) return items;
  return [
    ...items,
    {
      id: "identity-verified",
      icon: "shield",
      title: "Identity verified",
      subtitle: "You can now send money.",
      when: "Today",
    },
  ];
}

function Leading({ item }: { item: NotificationItem }): ReactNode {
  if (item.person) {
    return <PersonAvatar initials={personInitials(item.person)} />;
  }
  return <IconCircle icon={item.icon ?? "plus"} />;
}

type RowProps = { item: NotificationItem; isLast: boolean };

function NotificationRow({ item, isLast }: RowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${item.title}. ${item.subtitle}. ${item.when}`}
      className={cn(
        "flex-row items-start gap-3 py-[14px]",
        !isLast && "border-b border-line",
      )}
    >
      <Leading item={item} />
      <View className="min-w-0 flex-1">
        <Text className="font-text-medium text-[16px]">{item.title}</Text>
        <Text className="mt-[2px] text-[13px] text-ink-3">{item.subtitle}</Text>
        <Text className="mt-1 text-[12px] leading-[17px] text-ink-3">
          {item.when}
        </Text>
      </View>
    </View>
  );
}

export function NotificationsScreen() {
  const txs = useWalletStore((s) => s.txs);
  const markRead = useWalletStore((s) => s.markRead);
  const tier = useOnboardingStore((s) => s.tier);

  useEffect(() => {
    markRead();
  }, [markRead]);

  const items = buildNotifications(txs, tier);

  return (
    <Screen>
      <TopBar title="Notifications" />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <ListGroup>
          {items.map((item, index) => (
            <NotificationRow
              key={item.id}
              item={item}
              isLast={index === items.length - 1}
            />
          ))}
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}
