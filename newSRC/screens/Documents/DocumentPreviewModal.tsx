import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Images } from "../../utils/Images";
import { AppColors as Colors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";

type Props = {
  visible: boolean;
  title?: string;
  imageUri?: string | null;
  downloadUrl?: string | null;
  fileType?: string | null;
  onClose: () => void;
};

export default function DocumentPreviewModal({
  visible,
  title,
  imageUri,
  downloadUrl,
  fileType,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isPdf = String(fileType || "").toLowerCase() === "pdf";

  const imageStyle = useMemo(
    () => ({
      width: screenWidth - 24,
      height: screenHeight * 0.72,
    }),
    [screenHeight, screenWidth],
  );

  const onDownload = async () => {
    if (!downloadUrl) return;
    try {
      await Linking.openURL(downloadUrl);
    } catch {
      // no-op
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.92)" barStyle="light-content" />
      <View style={styles.backdrop}>
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top, 12), paddingBottom: 12 },
          ]}
        >
          <Text style={styles.title} numberOfLines={1}>
            {title || t("Document")}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Image source={Images.CloseIcon} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>

        <Pressable style={styles.imageWrap} onPress={isPdf ? undefined : onClose}>
          {imageUri && isPdf && Platform.OS !== "web" ? (
            <WebView
              source={{ uri: imageUri }}
              style={[styles.pdf, imageStyle]}
              startInLoadingState
            />
          ) : imageUri && isPdf ? (
            <TouchableOpacity
              style={styles.webPdfBtn}
              onPress={() => Linking.openURL(imageUri)}
              activeOpacity={0.85}
            >
              <Text style={styles.downloadText}>{t("Document")}</Text>
            </TouchableOpacity>
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={imageStyle}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>

        {downloadUrl ? (
          <TouchableOpacity
            style={[
              styles.downloadBtn,
              { marginBottom: Math.max(insets.bottom, 16) },
            ]}
            onPress={onDownload}
            activeOpacity={0.85}
          >
            <Text style={styles.downloadText}>{t("Download")}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ height: Math.max(insets.bottom, 16) }} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
    color: Colors.white,
  },
  closeIcon: {
    width: 22,
    height: 22,
    tintColor: Colors.white,
  },
  imageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  pdf: {
    backgroundColor: "transparent",
  },
  webPdfBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 7,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  downloadBtn: {
    alignSelf: "center",
    backgroundColor: Colors.primary,
    borderRadius: 7,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  downloadText: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
    color: Colors.white,
  },
});
