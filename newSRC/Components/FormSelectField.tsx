import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";

type Props = {
  label: string;
  required?: boolean;
  placeholder: string;
  value?: string;
  onPress: () => void;
  error?: string;
  disabled?: boolean;
};

function FormSelectField({
  label,
  required = false,
  placeholder,
  value,
  onPress,
  error,
  disabled = false,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.field,
          error ? styles.errorBorder : null,
          disabled ? styles.fieldDisabled : null,
        ]}
      >
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={2}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.placeholder} />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default React.memo(FormSelectField);

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  required: {
    color: Colors.dicline,
  },
  field: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
  },
  placeholder: {
    color: Colors.placeholder,
    fontFamily: FONTS.OutfitRegular,
  },
  errorBorder: {
    borderColor: Colors.dicline,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.dicline,
  },
  fieldDisabled: {
    opacity: 0.55,
  },
});
