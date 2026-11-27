import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { usePlayStoreInAppUpdate } from "../hooks/usePlayStoreInAppUpdate";
import { FONTS } from "../utils/FONTS";
import { useScreenInsets } from "../utils/screenInsets";
import { AppColors } from "../utils/theme";

type StoreUpdatePromptMode = "available" | "ready";

type StoreUpdatePopupProps = {
  visible: boolean;
  mode: StoreUpdatePromptMode;
  storeName: "Play Store" | "App Store";
  currentVersion?: string;
  storeVersion?: string;
  force?: boolean;
  loading?: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
};

function StoreUpdatePopup({
  visible,
  mode,
  storeName,
  currentVersion,
  storeVersion,
  force = false,
  loading = false,
  onUpdate,
  onDismiss,
}: StoreUpdatePopupProps) {
  const { t } = useTranslation();
  const { modalPadding } = useScreenInsets();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(false);

  const isReady = mode === "ready";
  const title = isReady ? t("Update ready") : t("Update Available");
  const subtitle = isReady
    ? t("The new version has finished downloading. Restart to install it now.")
    : t("A newer version is available on the {{store}}. Update to get the latest app.", {
        store: t(storeName),
      });
  const primaryLabel = isReady ? t("Restart & install") : t("Update Now");

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withSpring(1, { damping: 18, stiffness: 240, mass: 0.8 });
      return;
    }

    if (!mounted) return;

    progress.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [visible, mounted, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 1, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [28, 0], Extrapolation.CLAMP) },
    ],
  }));

  if (!mounted) return null;

  return (
    <View style={styles.host} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        {force ? (
          <View style={StyleSheet.absoluteFill} />
        ) : (
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        )}
      </Animated.View>

      <Animated.View style={[styles.card, cardStyle, { marginBottom: Math.max(modalPadding, 20) }]}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isReady ? "checkmark-circle" : "cloud-download-outline"}
            size={32}
            color={AppColors.primary}
          />
        </View>
        <Text style={styles.storeLabel}>{t(storeName)}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {currentVersion || storeVersion ? (
          <View style={styles.versionRow}>
            {currentVersion ? (
              <View style={styles.versionChip}>
                <Text style={styles.versionLabel}>{t("Current")}</Text>
                <Text style={styles.versionValue}>v{currentVersion}</Text>
              </View>
            ) : null}
            {storeVersion ? (
              <View style={[styles.versionChip, styles.versionChipNew]}>
                <Text style={[styles.versionLabel, styles.versionLabelNew]}>{t("New")}</Text>
                <Text style={[styles.versionValue, styles.versionValueNew]}>v{storeVersion}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable style={styles.primaryBtn} onPress={onUpdate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
          )}
        </Pressable>

        {force ? null : (
          <Pressable style={styles.secondaryBtn} onPress={onDismiss} disabled={loading}>
            <Text style={styles.secondaryBtnText}>{t("Not now")}</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

export function StoreInAppUpdateGate() {
  const { prompt, storeName, currentVersion, loading, confirmPrompt, dismissPrompt } =
    usePlayStoreInAppUpdate();

  return (
    <StoreUpdatePopup
      visible={prompt != null}
      mode={prompt?.mode ?? "available"}
      storeName={storeName}
      currentVersion={currentVersion}
      storeVersion={prompt?.storeVersion}
      force={prompt?.force ?? false}
      loading={loading}
      onUpdate={() => {
        void confirmPrompt();
      }}
      onDismiss={dismissPrompt}
    />
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1200,
    elevation: 1200,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  iconWrap: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E8F0FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  storeLabel: {
    textAlign: "center",
    fontFamily: FONTS.LexendMedium,
    fontSize: 12,
    color: AppColors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 20,
    color: AppColors.black,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: FONTS.LexendRegular,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.subtitle,
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
  },
  versionChip: {
    minWidth: 110,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  versionChipNew: {
    borderColor: AppColors.primary,
    backgroundColor: "#E8F0FC",
  },
  versionLabel: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 11,
    color: AppColors.subtitle,
    marginBottom: 2,
  },
  versionLabelNew: {
    color: AppColors.primary,
  },
  versionValue: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    color: AppColors.black,
  },
  versionValueNew: {
    color: AppColors.primary,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.white,
  },
  secondaryBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.subtitle,
  },
});
