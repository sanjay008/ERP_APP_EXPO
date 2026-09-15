import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { AUTH_PLACEHOLDER_COLOR, authTypography } from "../../utils/authTypography";
import { AppColors } from "../../utils/theme";

type AuthInputProps = TextInputProps & {
  label: string;
  required?: boolean;
  error?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
};

export default function AuthInput({
  label,
  required = false,
  error,
  iconName,
  rightIcon,
  onRightIconPress,
  ...inputProps
}: AuthInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={authTypography.label}>
        {label}
        {required ? <Text style={authTypography.required}> *</Text> : null}
      </Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {iconName ? (
          <Ionicons name={iconName} size={18} color={AppColors.subtitle} style={styles.leftIcon} />
        ) : null}
        <TextInput
          {...inputProps}
          style={[authTypography.input, styles.input, inputProps.style]}
          placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[authTypography.error, styles.errorSpacing]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  errorSpacing: {
    marginTop: 6,
  },
});
