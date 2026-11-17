import { View } from "react-native";

import { PEOPLE, personInitials, personName } from "@/features/send/people";
import { fmt } from "@/lib/format";
import { fullPhone } from "@/lib/phone";
import { useWalletStore } from "@/stores/wallet-store";

import { PersonAvatar } from "./person-avatar";
import { Text } from "./text";
import { VerifiedBadge } from "./verified-badge";

type PersonCardProps = { personKey: string };

const AVATAR_SIZE = 56;
const TABULAR = { fontVariant: ["tabular-nums"] } as const;

/** Recipient summary: avatar, verified name, phone and the last amount sent. */
export function PersonCard({ personKey }: PersonCardProps) {
  const person = PEOPLE[personKey];
  const lastSent = useWalletStore((s) =>
    s.txs.find((t) => t.type === "sent" && t.whoKey === personKey),
  );

  if (!person) return null;

  return (
    <View className="rounded-[18px] border border-line bg-surface p-4">
      <View className="flex-row items-center gap-[14px]">
        <PersonAvatar initials={personInitials(person)} size={AVATAR_SIZE} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center">
            <Text
              numberOfLines={1}
              className="shrink font-display text-[20px] tracking-[-0.3px]"
            >
              {personName(person)}
            </Text>
            <VerifiedBadge />
          </View>
          <Text className="mt-[2px] text-[14px] text-ink-2" style={TABULAR}>
            {fullPhone(person.cc, person.num)}
          </Text>
        </View>
      </View>
      {lastSent ? (
        <View className="mt-[14px] flex-row items-center justify-between gap-3 border-t border-line pt-3">
          <Text className="text-[13.5px] text-ink-2">Last sent</Text>
          <Text className="text-[13.5px] text-ink-2" style={TABULAR}>
            <Text className="font-text-semibold text-[13.5px] text-ink">
              {fmt(-lastSent.amount)} USDT
            </Text>
            {` · ${lastSent.whenLabel}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
