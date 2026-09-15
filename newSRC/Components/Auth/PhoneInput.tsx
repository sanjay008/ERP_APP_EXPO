import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { authTypography, AUTH_PLACEHOLDER_COLOR } from "../../utils/authTypography";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";

type PhoneInputProps = {
  label: string;
  countryCode: string;
  value: string;
  error?: string;
  onChangeCountry: () => void;
  onChangeNumber: (value: string) => void;
};

export default function PhoneInput({
  label,
  countryCode,
  value,
  error,
  onChangeCountry,
  onChangeNumber,
}: PhoneInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={authTypography.label}>
        {label}
        <Text style={authTypography.required}> *</Text>
      </Text>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <Pressable style={styles.countryButton} onPress={onChangeCountry}>
          <Text style={styles.flag}>🌐</Text>
          <Text style={styles.countryCode}>+{countryCode.replace(/[^\d]/g, "")}</Text>
          <Ionicons name="chevron-down" size={16} color={AppColors.subtitle} />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChangeNumber}
          placeholder="Enter whatsapp number"
          placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
          keyboardType="phone-pad"
          style={[authTypography.input, styles.phoneInput]}
        />
      </View>
      {error ? <Text style={[authTypography.error, styles.errorSpacing]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    paddingRight: 12,
    backgroundColor: AppColors.white,
  },
  rowError: {
    borderColor: "#EF4444",
  },
  countryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    minHeight: 52,
  },
  flag: {
    fontSize: 16,
  },
  countryCode: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(13),
    color: AppColors.black,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
  },
  errorSpacing: {
    marginTop: 6,
  },
});
