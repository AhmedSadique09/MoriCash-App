import { useRouter } from "expo-router";
import { ScrollView, View, type TextStyle } from "react-native";

import { BrandMini } from "@/components/ui/brand-mini";
import { Button } from "@/components/ui/button";
import { DetailList } from "@/components/ui/detail-list";
import { Footer, Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TimelineList } from "@/components/ui/timeline-list";
import { TopBar } from "@/components/ui/top-bar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { fmt } from "@/lib/format";
import { resetTo } from "@/lib/navigation";
import { fullPhone } from "@/lib/phone";
import { toast } from "@/stores/toast-store";
import { useWalletStore, type Tx } from "@/stores/wallet-store";

import { PEOPLE, personName } from "./people";

const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };
const FEE_LABEL = "0.00 USDT";
const SHARE_HINT = "Opens the share sheet with a receipt image";

function buildRows(tx: Tx, mobile: string, balance: number) {
  return [
    { label: "Status", value: "Completed" },
    { label: "Mobile", value: mobile },
    { label: "Verified by", value: tx.via === "qr" ? "QR code" : "Mobile number" },
    ...(tx.note ? [{ label: "Note", value: tx.note }] : []),
    { label: "Fee", value: FEE_LABEL },
    { label: "Balance after", value: `${fmt(balance)} USDT` },
    {
      label: "Reference",
      value: <Text className="font-mono-medium text-[14px]">{tx.ref}</Text>,
    },
  ];
}

type ReceiptCardProps = { tx: Tx; balance: number };

function ReceiptCard({ tx, balance }: ReceiptCardProps) {
  const person = PEOPLE[tx.whoKey ?? ""];
  const name = person ? personName(person) : tx.title;
  const mobile = person ? fullPhone(person.cc, person.num) : "";

  return (
    <View className="mt-[6px] rounded-[20px] border border-line bg-surface px-[18px] pb-2 pt-[18px]">
      <View className="flex-row items-center justify-between border-b border-line pb-[14px]">
        <BrandMini />
        <Text className="text-[12px] leading-[17px] text-ink-3">{tx.dateLabel}</Text>
      </View>
      <Text className="mt-[18px] font-text-semibold text-[12px] uppercase tracking-[0.72px] text-ink-3">
        You sent
      </Text>
      <Text
        className="mt-1 font-display text-[40px] leading-[44px] tracking-[-1.4px]"
        style={TABULAR_NUMS}
      >
        {fmt(-tx.amount)} <Text className="font-display text-[20px] text-ink-3">USDT</Text>
      </Text>
      <View className="mt-1 flex-row items-center">
        <Text className="text-[15px] text-ink-2">{`to ${name}`}</Text>
        <VerifiedBadge />
      </View>
      <View className="mt-4 border-t border-line">
        <DetailList
          rows={buildRows(tx, mobile, balance)}
          className="rounded-none border-0 bg-transparent px-0"
        />
      </View>
      <Text className="mt-[18px] font-text-semibold text-[12px] uppercase tracking-[0.72px] text-ink-3">
        Timeline
      </Text>
      <View className="mb-1 mt-3">
        <TimelineList items={tx.timeline ?? []} />
      </View>
    </View>
  );
}

export function SendReceiptScreen() {
  const router = useRouter();
  const tx = useWalletStore((s) => s.txs.find((t) => t.type === "sent"));
  const balance = useWalletStore((s) => s.balanceUsdt);

  const handleShare = () => toast(SHARE_HINT);
  const handleDone = () => resetTo(router, "/home");

  return (
    <Screen>
      <TopBar title="Receipt" />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        {tx ? (
          <ReceiptCard tx={tx} balance={balance} />
        ) : (
          <Text className="mt-6 text-center text-[15px] leading-[22px] text-ink-2">
            No transfer to show yet.
          </Text>
        )}
      </ScrollView>
      <Footer>
        <View className="flex-row gap-[10px]">
          <Button
            label="Share"
            variant="sec"
            icon="share"
            onPress={handleShare}
            className="w-auto flex-1"
          />
          <Button label="Done" onPress={handleDone} className="w-auto flex-1" />
        </View>
      </Footer>
    </Screen>
  );
}
