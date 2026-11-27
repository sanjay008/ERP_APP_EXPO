import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useScreenInsets } from "../utils/screenInsets";
import { FONTS } from "../utils/FONTS";
import { AppColors } from "../utils/theme";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ENTER = { duration: 160, easing: Easing.out(Easing.cubic) };
const EXIT = { duration: 120, easing: Easing.in(Easing.cubic) };

export default function ExitAppConfirmModal({ visible, onCancel, onConfirm }: Props) {
  const { t } = useTranslation();
  const { modalPadding } = useScreenInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, ENTER);
      return;
    }

    if (!mounted) return;
    progress.value = withTiming(0, EXIT, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [visible, mounted, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View style={[styles.card, { marginBottom: modalPadding }, cardStyle]}>
          <Text style={styles.title}>{t("Hold on!")}</Text>
          <Text style={styles.message}>{t("Are you sure you want to exit?")}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={onCancel}>
              <Text style={styles.btnText}>{t("Cancel")}</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onConfirm}>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>{t("YES")}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    width: "100%",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 24,
    zIndex: 1,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 20,
    color: AppColors.black,
    marginBottom: 8,
  },
  message: {
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E5EA",
    backgroundColor: AppColors.white,
  },
  btnPrimary: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  btnText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
  },
  btnTextPrimary: {
    color: AppColors.white,
  },
});
