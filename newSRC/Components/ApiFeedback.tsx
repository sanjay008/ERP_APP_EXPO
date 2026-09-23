import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { ParsedApiError } from "../utils/apiError";
import { isEmptyParsedError } from "../utils/apiError";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";

type ApiFeedbackProps = {
  error?: ParsedApiError | null;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export default function ApiFeedback({
  error,
  loading = false,
  isEmpty = false,
  emptyMessage,
  onRetry,
  compact = false,
}: ApiFeedbackProps) {
  const { t } = useTranslation();
  const emptyError = isEmptyParsedError(error);

  if (loading) {
    return (
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (error && !emptyError) {
    const isOffline = error.kind === "offline";
    const iconName = isOffline ? "cloud-offline-outline" : "alert-circle-outline";

    return (
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        <Ionicons
          name={iconName}
          size={compact ? 28 : 36}
          color={isOffline ? AppColors.primary : "#D14343"}
        />
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {isOffline ? t("No internet connection") : t("Something went wrong")}
        </Text>
        <Text style={[styles.message, compact && styles.messageCompact]}>{t(error.message)}</Text>
        {onRetry ? (
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>{t("Try again")}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isEmpty || emptyError) {
    return (
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        <Text style={[styles.message, compact && styles.messageCompact]}>
          {emptyMessage || t("No Data Found")}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 10,
  },
  wrapCompact: {
    paddingVertical: 28,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
    textAlign: "center",
  },
  titleCompact: {
    fontSize: 15,
  },
  message: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.subtitle,
    textAlign: "center",
  },
  messageCompact: {
    fontSize: 13,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
  },
  retryText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.white,
  },
});
