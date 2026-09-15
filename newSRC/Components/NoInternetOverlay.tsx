import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useNetwork } from "../context/NetworkContext";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";

export default function NoInternetOverlay() {
  const { t } = useTranslation();
  const { isOnline, isReady, refreshNetwork } = useNetwork();
  const [retrying, setRetrying] = useState(false);

  if (!isReady || isOnline) {
    return null;
  }

  const onRetry = async () => {
    setRetrying(true);
    try {
      await refreshNetwork();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-offline-outline" size={42} color={AppColors.primary} />
          </View>
          <Text style={styles.title}>{t("No internet connection")}</Text>
          <Text style={styles.subtitle}>
            {t("Please check your internet and try again.")}
          </Text>

          <Pressable
            style={[styles.retryBtn, retrying && styles.retryBtnDisabled]}
            onPress={onRetry}
            disabled={retrying}
          >
            {retrying ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <Text style={styles.retryText}>{t("Try again")}</Text>
            )}
          </Pressable>

          <Text style={styles.hintText}>{t("Waiting for connection...")}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEF4FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 18,
    color: AppColors.black,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.subtitle,
    textAlign: "center",
    marginBottom: 18,
  },
  retryBtn: {
    minWidth: 160,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  retryBtnDisabled: {
    opacity: 0.7,
  },
  retryText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.white,
  },
  hintText: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 12,
    color: AppColors.subtitle,
    textAlign: "center",
  },
});
