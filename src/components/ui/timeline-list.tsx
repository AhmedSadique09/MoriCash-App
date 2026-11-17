import { View } from "react-native";

import { Icon } from "./icon";
import { Text } from "./text";

type TimelineItem = { title: string; time: string };

type TimelineListProps = { items: TimelineItem[] };

const BULLET_SIZE = 28;
const CONNECTOR_LEFT = 13;
const CHECK_SIZE = 12;
const CHECK_STROKE = 3;

/** Vertical list of completed steps joined by a green connector. */
export function TimelineList({ items }: TimelineListProps) {
  return (
    <View accessibilityRole="list">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View
            key={`${item.title}-${item.time}`}
            accessible
            accessibilityLabel={`${item.title}, ${item.time}`}
            className={isLast ? "flex-row gap-3" : "flex-row gap-3 pb-4"}
          >
            {isLast ? null : (
              <View
                className="absolute bottom-[2px] w-[2px] bg-pos"
                style={{ left: CONNECTOR_LEFT, top: BULLET_SIZE }}
              />
            )}
            <View
              className="items-center justify-center rounded-full bg-pos"
              style={{ width: BULLET_SIZE, height: BULLET_SIZE }}
            >
              <Icon name="check" size={CHECK_SIZE} strokeWidth={CHECK_STROKE} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="font-text-semibold pt-1 text-[15px]">{item.title}</Text>
              <Text className="text-[12px] leading-[17px] text-ink-3">{item.time}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
