import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { ListGroup, RadioRow } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import { COUNTRY_CODES, type CountryCode } from "@/lib/phone";

const OPTIONS: readonly CountryCode[] = ["+81", "+63"];
const SCRIM_COLOR = "rgba(0, 0, 0, 0.4)";
const SHEET_MIN_BOTTOM = 16;
const SHEET_EXTRA_BOTTOM = 8;

type Props = {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
};

/** "JP +81" chip for the mobile field; taps open a small list to switch country. */
export function CountryCodeSelect({ value, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const { iso, name } = COUNTRY_CODES[value];

  const close = () => setIsOpen(false);
  const handleSelect = (code: CountryCode) => {
    onChange(code);
    close();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Country code, ${name} ${value}`}
        accessibilityHint="Opens the list of country codes"
        onPress={() => setIsOpen(true)}
        className="mr-2 h-[42px] flex-row items-center gap-1 rounded-[9px] bg-surface-2 px-[10px]"
      >
        <Text className="font-text-semibold text-[15px] tabular-nums">
          {`${iso} ${value}`}
        </Text>
        <Icon name="chevD" size={14} strokeWidth={2.2} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        // Draw under the Android nav bar so the scrim reaches the edge and the
        // sheet's single bottom inset below is not stacked on a reserved bar.
        navigationBarTranslucent
        onRequestClose={close}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: SCRIM_COLOR }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
          <View
            className="rounded-t-[24px] border-t border-line bg-bg px-5 pt-4"
            style={{
              paddingBottom:
                Math.max(insets.bottom, SHEET_MIN_BOTTOM) + SHEET_EXTRA_BOTTOM,
            }}
          >
            <Text
              accessibilityRole="header"
              className="mb-3 font-text-semibold text-[17px]"
            >
              Country code
            </Text>
            <ListGroup>
              {OPTIONS.map((code, index) => (
                <RadioRow
                  key={code}
                  label={`${COUNTRY_CODES[code].name} (${code})`}
                  selected={code === value}
                  onPress={() => handleSelect(code)}
                  isLast={index === OPTIONS.length - 1}
                />
              ))}
            </ListGroup>
          </View>
        </View>
      </Modal>
    </>
  );
}
