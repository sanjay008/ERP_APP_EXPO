import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../../utils/theme";
import { authTypography } from "../../utils/authTypography";

type SwitchMethodButtonProps = {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function SwitchMethodButton({
  label,
  iconName = "logo-whatsapp",
  onPress,
}: SwitchMethodButtonProps) {
  const isWhatsappIcon = iconName === "logo-whatsapp";
  const iconColor = isWhatsappIcon ? "#25D366" : AppColors.subtitle;

  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Ionicons name={iconName} size={18} color={iconColor} style={styles.icon} />
      <Text style={[authTypography.secondaryAction, styles.label]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    backgroundColor: AppColors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  icon: {
    flexShrink: 0,
  },
  label: {
    flexShrink: 1,
    color: AppColors.subtitle,
  },
});

type BackLinkProps = {
  label: string;
  onPress: () => void;
};

export function BackLink({ label, onPress }: BackLinkProps) {
  return (
    <Pressable onPress={onPress} style={backStyles.link}>
      <Ionicons name="chevron-back" size={16} color={AppColors.primary} />
      <Text style={authTypography.backLink}>{label}</Text>
    </Pressable>
  );
}

const backStyles = StyleSheet.create({
  link: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
  },
});

export function AuthSecondaryButton({
  label,
  iconName,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={secondaryStyles.button}>
      <Ionicons name={iconName} size={18} color="#25D366" />
      <Text style={authTypography.secondaryAction}>{label}</Text>
    </Pressable>
  );
}

const secondaryStyles = StyleSheet.create({
  button: {
    marginTop: 16,
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: AppColors.white,
  },
});
