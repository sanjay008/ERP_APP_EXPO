import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { AppColors } from "../../utils/theme";
import { authTypography } from "../../utils/authTypography";

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function AuthButton({
  title,
  onPress,
  disabled = false,
  loading = false,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={AppColors.white} />
      ) : (
        <Text style={authTypography.button}>{title}</Text>
      )}
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
