import { Pressable, StyleSheet, Text } from "react-native";
import { AppColors } from "../../utils/theme";
import { authTypography } from "../../utils/authTypography";

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function AuthButton({ title, onPress, disabled = false }: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={authTypography.button}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: AppColors.onboardingButton,
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    backgroundColor: "#B8C9EF",
  },
  pressed: {
    opacity: 0.92,
  },
});
