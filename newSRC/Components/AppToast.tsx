import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { RegisterBackContext } from "../constants/GoBackContext";
import { useThemeStore } from "../store/themeStore";
import { FONTS } from "../utils/FONTS";

type ToastKind = "success" | "warn" | "error";

const ENTER = { duration: 260, easing: Easing.out(Easing.cubic) };
const EXIT = { duration: 180, easing: Easing.in(Easing.cubic) };
const HOLD_MS = 3200;

function toastKind(type?: string): ToastKind {
  const value = String(type || "").toLowerCase();
  if (value === "success") return "success";
  if (value === "warn" || value === "warning") return "warn";
  return "error";
}

const ICON: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark",
  warn: "remove",
  error: "close",
};

const ICON_BG: Record<ToastKind, string> = {
  success: "#22C55E",
  warn: "#F59E0B",
  error: "#EF4444",
};

export default function AppToast() {
  const { toast, clearToast } = useContext(RegisterBackContext);
  const mode = useThemeStore((state) => state.mode);
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState(toast);
  const hiding = useRef(false);
  const progress = useSharedValue(0);

  const isLightTheme = mode !== "dark";
  const kind = toastKind(shown?.type);

  const finishHide = useCallback(() => {
    hiding.current = false;
    setShown(null);
    clearToast();
  }, [clearToast]);

  const hide = useCallback(() => {
    if (hiding.current) return;
    hiding.current = true;
    cancelAnimation(progress);
    progress.value = withTiming(0, EXIT, (finished) => {
      if (finished) runOnJS(finishHide)();
    });
  }, [finishHide, progress]);

  const show = useCallback(
    (next: NonNullable<typeof toast>) => {
      hiding.current = false;
      setShown(next);
      cancelAnimation(progress);
      progress.value = 0;
      progress.value = withTiming(1, ENTER);
    },
    [progress]
  );

  useEffect(() => {
    if (!toast?.visible || !toast.text) return;
    show(toast);
    const timer = setTimeout(hide, HOLD_MS);
    return () => clearTimeout(timer);
  }, [toast, hide, show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * -20 },
      { scale: 0.96 + progress.value * 0.04 },
    ],
  }));

  if (!shown?.text) return null;

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={[styles.toast, isLightTheme ? styles.toastOnLight : styles.toastOnDark]}>
          <View style={[styles.icon, { backgroundColor: ICON_BG[kind] }]}>
            <Ionicons name={ICON[kind]} size={13} color="#FFFFFF" />
          </View>
          <Text
            style={[styles.text, isLightTheme ? styles.textOnLight : styles.textOnDark]}
            numberOfLines={3}
          >
            {shown.text}
          </Text>
          <Pressable onPress={hide} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={isLightTheme ? "#A3A3A3" : "#6B7280"} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
  },
  toast: {
    minHeight: 52,
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastOnLight: {
    backgroundColor: "#111111",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 20,
  },
  toastOnDark: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 20,
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: FONTS.LexendMedium,
  },
  textOnLight: {
    color: "#FFFFFF",
  },
  textOnDark: {
    color: "#111111",
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
