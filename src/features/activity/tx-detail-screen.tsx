import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, View, type TextStyle } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { Icon } from "@/components/ui/icon";
import { IconCircle } from "@/components/ui/icon-circle";
import type { IconName } from "@/components/ui/icon-paths";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { Pill } from "@/components/ui/pill";
import { Screen } from "@/components/ui/screen";
import { SectionHead } from "@/components/ui/section-head";
import { Text } from "@/components/ui/text";
import { TimelineList } from "@/components/ui/timeline-list";
import { TopBar } from "@/components/ui/top-bar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  PEOPLE,
  personInitials,
  personName,
  type Person,
} from "@/features/send/people";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import { fullPhone } from "@/lib/phone";
import { toast } from "@/stores/toast-store";
import { useWalletStore, type Tx, type TxType } from "@/stores/wallet-store";

type DetailRows = ComponentProps<typeof DetailList>["rows"];

const TX_ICONS: Record<TxType, IconName> = {
  deposit: "plus",
  sent: "send",
  received: "down",
};

const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };
const COPY_HIT_SLOP = 6;

type ReferenceValueProps = { reference: string; onCopy: () => void };

function ReferenceValue({ reference, onCopy }: ReferenceValueProps) {
  return (
    <>
      <Text className="font-mono text-[13px] tracking-[-0.13px]">
        {reference}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Copy reference"
        hitSlop={COPY_HIT_SLOP}
        onPress={onCopy}
        className="h-8 w-8 items-center justify-center rounded-[10px] active:bg-surface-2"
      >
        <Icon name="copy" size={16} />
      </Pressable>
    </>
  );
}

function PersonValue({ person }: { person: Person }) {
  return (
    <>
      <Text className="shrink font-text-medium text-[15px]">
        {personName(person)}
      </Text>
      <VerifiedBadge />
    </>
  );
}

function personRows(tx: Tx, person: Person): DetailRows {
  const noteRows: DetailRows = tx.note
    ? [{ label: "Note", value: `“${tx.note}”` }]
    : [];
  return [
    {
      label: tx.type === "sent" ? "To" : "From",
      value: <PersonValue person={person} />,
    },
    { label: "Mobile", value: fullPhone(person.cc, person.num) },
    {
      label: "Verified by",
      value: tx.via === "qr" ? "QR code" : "Mobile number",
    },
    ...noteRows,
    { label: "Fee", value: "Free" },
  ];
}

function depositRows(tx: Tx): DetailRows {
  return [
    ...(tx.method ? [{ label: "Method", value: tx.method }] : []),
    ...(tx.fee ? [{ label: "Fee", value: tx.fee }] : []),
  ];
}

function buildRows(
  tx: Tx,
  person: Person | undefined,
  onCopy: () => void,
): DetailRows {
  return [
    {
      label: "Status",
      value: <Pill label={tx.status} tone="pos" icon="check" />,
    },
    { label: "Date", value: tx.dateLabel },
    ...(person ? personRows(tx, person) : depositRows(tx)),
    {
      label: "Reference",
      value: <ReferenceValue reference={tx.ref} onCopy={onCopy} />,
    },
  ];
}

type HeadProps = { tx: Tx; person: Person | undefined };

function TxHead({ tx, person }: HeadProps) {
  const caption = person
    ? `${tx.type === "sent" ? "Sent to" : "Received from"} ${personName(person)}`
    : tx.title;

  return (
    <View className="items-center pt-2">
      {person ? (
        <PersonAvatar initials={personInitials(person)} size={52} />
      ) : (
        <IconCircle icon={TX_ICONS[tx.type]} size={56} iconSize={26} />
      )}
      <Text className="mt-3 text-center text-[15px] leading-[22px] text-ink-2">
        {caption}
      </Text>
    </View>
  );
}

function HeroAmount({ amount }: { amount: number }) {
  const isIncoming = amount > 0;

  return (
    <Text
      className={cn(
        "mt-1 text-center font-display text-[36px] leading-[38px] tracking-[-1.26px]",
        isIncoming && "text-pos",
      )}
      style={TABULAR_NUMS}
    >
      {isIncoming ? "+" : "−"}
      {fmt(Math.abs(amount))}{" "}
      <Text className="font-display text-[24px] text-ink-3">USDT</Text>
    </Text>
  );
}

function TxNotFound() {
  const router = useRouter();

  return (
    <View className="items-center px-5 pt-16">
      <IconCircle icon="doc" size={56} iconSize={26} />
      <Text className="mt-4 font-text-semibold text-[17px]">
        Transaction not found
      </Text>
      <Text className="mb-6 mt-1 text-center text-[13px] text-ink-3">
        We couldn’t find that payment. It may have been removed.
      </Text>
      <Button
        label="Back to activity"
        variant="sec"
        onPress={() => router.navigate("/activity")}
      />
    </View>
  );
}

async function copyReference(reference: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(reference);
    toast("Copied");
  } catch {
    toast("Couldn’t copy. Try again.");
  }
}

function TxContent({ tx }: { tx: Tx }) {
  const person = tx.whoKey ? PEOPLE[tx.whoKey] : undefined;
  const rows = buildRows(tx, person, () => void copyReference(tx.ref));

  return (
    <>
      <TxHead tx={tx} person={person} />
      <HeroAmount amount={tx.amount} />
      <DetailList className="mt-[22px]" rows={rows} />
      {tx.timeline ? (
        <>
          <SectionHead title="Timeline" className="mt-[22px]" />
          <Card>
            <TimelineList items={tx.timeline} />
          </Card>
        </>
      ) : null}
      <View className="mt-5 flex-row gap-[10px]">
        <View className="flex-1">
          <Button
            label="Share"
            variant="sec"
            icon="share"
            onPress={() => toast("Opens the share sheet with a receipt image")}
          />
        </View>
        <View className="flex-1">
          <Button
            label="Get help"
            variant="sec"
            icon="help"
            onPress={() => toast("Not part of this prototype yet")}
          />
        </View>
      </View>
    </>
  );
}

export function TxDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const txId = Array.isArray(id) ? id[0] : id;
  const tx = useWalletStore((s) => s.txs.find((item) => item.id === txId));

  return (
    <Screen>
      <TopBar title="Details" />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        {tx ? <TxContent tx={tx} /> : <TxNotFound />}
      </ScrollView>
    </Screen>
  );
}
