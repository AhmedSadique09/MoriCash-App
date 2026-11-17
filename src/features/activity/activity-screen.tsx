import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { Segmented } from "@/components/ui/segmented";
import { Screen } from "@/components/ui/screen";
import { StatTile } from "@/components/ui/stat-tile";
import { Text } from "@/components/ui/text";
import { EmptyActivity, TxRow } from "@/components/ui/tx-row";
import { ListGroup } from "@/components/ui/list";
import { fmt } from "@/lib/format";
import {
  useWalletStore,
  type Tx,
  type TxFilter,
} from "@/stores/wallet-store";

const HIDDEN_VALUE = "••••••";

const FILTER_OPTIONS: { value: TxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
];

function matchesFilter(tx: Tx, filter: TxFilter): boolean {
  if (filter === "sent") return tx.type === "sent";
  if (filter === "received") return tx.amount > 0;
  return true;
}

function sumByType(txs: readonly Tx[], type: Tx["type"]): number {
  return txs
    .filter((tx) => tx.type === type)
    .reduce((total, tx) => total + Math.abs(tx.amount), 0);
}

export function ActivityScreen() {
  const router = useRouter();
  const txs = useWalletStore((s) => s.txs);
  const filter = useWalletStore((s) => s.filter);
  const isHidden = useWalletStore((s) => s.isHidden);
  const setFilter = useWalletStore((s) => s.setFilter);

  const visibleTxs = txs.filter((tx) => matchesFilter(tx, filter));
  const sentTotal = fmt(sumByType(txs, "sent"));
  const receivedTotal = fmt(sumByType(txs, "received"));

  const openTx = (id: string) => {
    router.push({ pathname: "/tx/[id]", params: { id } });
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-5" contentContainerClassName="pt-1 pb-7">
        <Text
          accessibilityRole="header"
          className="mb-[2px] mt-[10px] font-display text-[30px] leading-[33px] tracking-[-0.75px]"
        >
          Activity
        </Text>
        <View className="mt-[14px] flex-row gap-[10px]">
          <View className="flex-1">
            <StatTile
              label="Sent this month"
              value={isHidden ? HIDDEN_VALUE : sentTotal}
            />
          </View>
          <View className="flex-1">
            <StatTile
              label="Received this month"
              value={isHidden ? HIDDEN_VALUE : receivedTotal}
              tone="pos"
            />
          </View>
        </View>
        <Segmented
          className="mt-[14px]"
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
        />
        <ListGroup className="mt-[14px]">
          {visibleTxs.length === 0 ? (
            <EmptyActivity />
          ) : (
            visibleTxs.map((tx, index) => (
              <TxRow
                key={tx.id}
                tx={tx}
                isHidden={isHidden}
                onPress={openTx}
                isLast={index === visibleTxs.length - 1}
              />
            ))
          )}
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}
