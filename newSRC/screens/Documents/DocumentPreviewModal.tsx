import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useScreenInsets } from "../../utils/screenInsets";
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
  const { top, modalPadding } = useScreenInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isPdf = String(fileType || "").toLowerCase() === "pdf";
  const [imageLoading, setImageLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!visible || !imageUri || isPdf) {
      setImageLoading(false);
      return;
    }
    setImageLoading(true);
    const timer = setTimeout(() => setImageLoading(false), 6000);
    return () => clearTimeout(timer);
  }, [visible, imageUri, isPdf]);

  const imageStyle = useMemo(
    () => ({
      width: screenWidth - 32,
      height: screenHeight * 0.68,
      borderRadius: 7,
    }),
    [screenHeight, screenWidth]
  );

  const onDownload = async () => {
    if (!downloadUrl || downloading) return;
    setDownloading(true);
    try {
      await Linking.openURL(downloadUrl);
    } catch {
      // no-op
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(8,12,20,0.96)" barStyle="light-content" />
      <View style={styles.backdrop}>
        <View style={[styles.header, { paddingTop: Math.max(top, 14) }]}>
          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>{t("Preview")}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {title || t("Document")}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Image source={Images.CloseIcon} style={styles.closeIcon} />
          </Pressable>
        </View>

        <View style={styles.imageWrap}>
          {imageUri && isPdf && Platform.OS !== "web" ? (
            <WebView
              source={{ uri: imageUri }}
              style={[styles.pdf, imageStyle]}
              startInLoadingState
            />
          ) : imageUri && isPdf ? (
            <Pressable style={styles.webPdfBtn} onPress={() => Linking.openURL(imageUri)}>
              <Text style={styles.downloadText}>{t("Document")}</Text>
            </Pressable>
          ) : imageUri ? (
            <View style={styles.imageFrame}>
              {imageLoading ? (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              ) : null}
              <Image
                source={{ uri: imageUri }}
                style={imageStyle}
                resizeMode="contain"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </View>
          ) : null}
        </View>

        <View style={[styles.footer, { paddingBottom: modalPadding }]}>
          {downloadUrl ? (
            <Pressable
              style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]}
              onPress={() => void onDownload()}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color={Colors.white} />
                  <Text style={styles.downloadText}>{t("Download")}</Text>
                </>
              )}
            </Pressable>
          ) : null}
          <Pressable style={styles.secondaryClose} onPress={onClose}>
            <Text style={styles.secondaryCloseText}>{t("Close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8,12,20,0.96)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FONTS.LexendMedium,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.white,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 14,
    height: 14,
    tintColor: Colors.white,
  },
  imageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  imageFrame: {
    alignItems: "center",
    justifyContent: "center",
  },
  loaderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  downloadBtn: {
    minHeight: 48,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  downloadBtnDisabled: {
    opacity: 0.85,
  },
  downloadText: {
    fontSize: 15,
    fontFamily: FONTS.LexendSemiBold,
    color: Colors.white,
  },
  secondaryClose: {
    minHeight: 44,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCloseText: {
    fontSize: 14,
    fontFamily: FONTS.LexendMedium,
    color: "rgba(255,255,255,0.9)",
  },
});
