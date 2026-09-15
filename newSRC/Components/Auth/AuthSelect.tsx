import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../../utils/theme";
import { authTypography } from "../../utils/authTypography";

type AuthSelectProps = {
  label: string;
  value?: string;
  placeholder: string;
  error?: string;
  onPress: () => void;
};

export default function AuthSelect({
  label,
  value,
  placeholder,
  error,
  onPress,
}: AuthSelectProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={authTypography.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[styles.select, error ? styles.selectError : null]}
      >
        <Text style={[authTypography.selectValue, styles.value, !value && authTypography.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={AppColors.subtitle} />
      </Pressable>
      {error ? <Text style={[authTypography.error, styles.errorSpacing]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  select: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.white,
  },
  selectError: {
    borderColor: "#EF4444",
  },
  value: {
    flex: 1,
  },
  errorSpacing: {
    marginTop: 6,
  },
});
