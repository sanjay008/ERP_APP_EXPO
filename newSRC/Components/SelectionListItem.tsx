import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  showCheckbox?: boolean;
};

function SelectionListItem({ label, selected, onPress, showCheckbox = true }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.rowSelected]}>
      {showCheckbox ? (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
      ) : null}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.divider} />
    </Pressable>
  );
}

export default React.memo(SelectionListItem);

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    paddingHorizontal: 4,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    position: "relative",
  },
  rowSelected: {
    backgroundColor: Colors.lightprimary1,
    borderRadius: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.SearchBorder,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkMark: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: FONTS.OutfitBold,
    lineHeight: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.placeholder,
  },
  labelSelected: {
    color: Colors.black,
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
  },
});
