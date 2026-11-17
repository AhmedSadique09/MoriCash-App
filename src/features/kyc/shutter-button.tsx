import { Pressable, View } from "react-native";

type Props = {
  onPress: () => void;
  label: string;
};

/** Camera shutter: 4px light ring around a filled disc, with a 4px gap. */
export function ShutterButton({ onPress, label }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-[76px] w-[76px] self-center rounded-full border-4 border-[#F3F4F6] p-1 active:scale-[0.95]"
    >
      <View className="flex-1 rounded-full bg-[#F3F4F6]" />
    </Pressable>
  );
}
