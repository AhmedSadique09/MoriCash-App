import { useRouter, type Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { startScan, startSend } from "@/features/send/start-send";
import { cn } from "@/lib/cn";
import { colors } from "@/theme/colors";

import { Icon } from "./icon";
import type { IconName } from "./icon-paths";
import { Text } from "./text";

const TAB_BAR_MIN_BOTTOM = 12;
const TAB_BAR_EXTRA_BOTTOM = 8;
const SCAN_HIT_SLOP_TOP = 12;
const SCAN_SHADOW = "0 10px 20px -10px rgba(160, 120, 0, 0.8)";

/** expo-router 58 ships its own tab-bar props (state/emitter/navigateToTab), not @react-navigation's. */
type TabBarProp = NonNullable<ComponentProps<typeof Tabs>["tabBar"]>;
export type AppTabBarProps = Parameters<TabBarProp>[0];

type TabVariant = "tab" | "send" | "scan";

type TabItem = {
  id: string;
  variant: TabVariant;
  icon: IconName;
  label: string;
  accessibilityLabel: string;
  /** Only set for items that map to a screen in the tabs navigator. */
  routeName?: string;
};

const TAB_ITEMS: readonly TabItem[] = [
  { id: "home", variant: "tab", icon: "home", label: "Home", accessibilityLabel: "Home", routeName: "home" },
  { id: "send", variant: "send", icon: "send", label: "Send", accessibilityLabel: "Send money" },
  { id: "scan", variant: "scan", icon: "scan", label: "Scan", accessibilityLabel: "Scan a QR code" },
  { id: "activity", variant: "tab", icon: "list", label: "Activity", accessibilityLabel: "Activity", routeName: "activity" },
  { id: "account", variant: "tab", icon: "user", label: "Account", accessibilityLabel: "Account", routeName: "account" },
];

type TabButtonProps = {
  item: TabItem;
  isActive: boolean;
  onPress: () => void;
};

function TabButton({ item, isActive, onPress }: TabButtonProps) {
  const isScan = item.variant === "scan";
  const isTab = item.variant === "tab";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={isTab ? "tab" : "button"}
      accessibilityLabel={item.accessibilityLabel}
      accessibilityState={isTab ? { selected: isActive } : undefined}
      hitSlop={isScan ? { top: SCAN_HIT_SLOP_TOP } : undefined}
      className="min-h-[44px] flex-1 items-center justify-center gap-[3px] px-0 py-[2px]"
    >
      <View
        className={cn(
          "h-[30px] w-[52px] items-center justify-center rounded-[15px]",
          isActive && "bg-sun-soft",
          isScan && "-mt-3 h-[44px] w-[54px] rounded-[16px] bg-sun",
        )}
        style={isScan ? { boxShadow: SCAN_SHADOW } : undefined}
      >
        <Icon
          name={item.icon}
          size={isScan ? 24 : 22}
          strokeWidth={isScan ? 2 : 1.75}
          color={
            isScan ? colors["on-sun"] : isActive ? colors.ink : colors["ink-3"]
          }
        />
      </View>
      <Text
        className={cn(
          "font-text-medium text-[11px] leading-[14px] text-ink-3",
          (isActive || isScan) && "font-text-semibold text-ink",
        )}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

/** Bottom bar: Home, Send, raised Scan, Activity, Account. Send/Scan open flows, never active. */
export function AppTabBar({ state, emitter, navigateToTab }: AppTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index]?.name;

  const handleItemPress = (item: TabItem) => {
    if (item.variant === "send") return startSend(router);
    if (item.variant === "scan") return startScan(router);

    const route = state.routes.find((r) => r.name === item.routeName);
    if (!route) return;
    const event = emitter.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (activeRouteName !== route.name && !event.defaultPrevented) {
      navigateToTab(route.key);
    }
  };

  return (
    <View
      className="flex-row border-t border-line bg-tab px-[6px] pt-2"
      style={{
        paddingBottom:
          Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM) + TAB_BAR_EXTRA_BOTTOM,
      }}
    >
      {TAB_ITEMS.map((item) => (
        <TabButton
          key={item.id}
          item={item}
          isActive={item.routeName !== undefined && item.routeName === activeRouteName}
          onPress={() => handleItemPress(item)}
        />
      ))}
    </View>
  );
}
