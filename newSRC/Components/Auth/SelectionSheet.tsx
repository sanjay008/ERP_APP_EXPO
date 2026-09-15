import { useMemo } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { RFValue } from "react-native-responsive-fontsize";

type Option = {
  label: string;
  value: string;
};

type SelectionSheetProps = {
  visible: boolean;
  title: string;
  options: Option[];
  onClose: () => void;
  onSelect: (option: Option) => void;
  closeOnSelect?: boolean;
};

export default function SelectionSheet({
  visible,
  title,
  options,
  onClose,
  onSelect,
  closeOnSelect = true,
}: SelectionSheetProps) {
  const { footerPadding } = useScreenInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: footerPadding }]}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  if (closeOnSelect) onClose();
                }}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function useSelectionOptions<T>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => string
) {
  return useMemo(
    () => items.map((item) => ({ label: getLabel(item), value: getValue(item) })),
    [items, getLabel, getValue]
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 16,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: RFValue(16),
    color: AppColors.black,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  itemText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(14),
    color: AppColors.black,
  },
});
