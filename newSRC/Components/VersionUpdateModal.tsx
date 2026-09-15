import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { getStoreUrl } from "../utils/versionCheck";
import { RFValue } from "react-native-responsive-fontsize";

type VersionUpdateModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function VersionUpdateModal({ visible, onClose }: VersionUpdateModalProps) {
  const { t } = useTranslation();

  const openStore = async () => {
    const url = getStoreUrl();
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={AppColors.black} />
          </Pressable>

          <Text style={styles.title}>{t("Update Available")}</Text>
          <Text style={styles.message}>
            {t("Your app version is outdated. Please update to the latest version.")}
          </Text>

          <Pressable style={styles.updateButton} onPress={openStore}>
            <Text style={styles.updateButtonText}>{t("Update Now")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 4,
  },
  title: {
    fontFamily: FONTS.LexendBold,
    fontSize: RFValue(18),
    color: AppColors.black,
    marginBottom: 10,
  },
  message: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(15),
    color: AppColors.black,
    lineHeight: RFValue(22),
  },
  updateButton: {
    marginTop: 20,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  updateButtonText: {
    fontFamily: FONTS.LexendBold,
    fontSize: RFValue(15),
    color: AppColors.white,
  },
});
