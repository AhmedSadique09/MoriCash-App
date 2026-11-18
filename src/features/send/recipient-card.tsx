import { View } from "react-native";

import { PersonAvatar } from "@/components/ui/person-avatar";
import { Text } from "@/components/ui/text";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { fullPhone } from "@/lib/phone";

import { personInitials, personName, type Person } from "./people";

const AVATAR_SIZE = 56;
const TABULAR = { fontVariant: ["tabular-nums"] } as const;

/** The recipient the server verified: avatar, name and phone. */
export function RecipientCard({ person }: { person: Person }) {
  return (
    <View className="rounded-[18px] border border-line bg-surface p-4">
      <View className="flex-row items-center gap-[14px]">
        <PersonAvatar initials={personInitials(person)} size={AVATAR_SIZE} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center">
            <Text numberOfLines={1} className="shrink font-display text-[20px] tracking-[-0.3px]">
              {personName(person)}
            </Text>
            <VerifiedBadge />
          </View>
          <Text className="mt-[2px] text-[14px] text-ink-2" style={TABULAR}>
            {fullPhone(person.cc, person.num)}
          </Text>
        </View>
      </View>
    </View>
  );
}
