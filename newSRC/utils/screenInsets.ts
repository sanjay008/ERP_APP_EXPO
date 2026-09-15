import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Floating custom tab bar approximate height (Figma 87px bar + top padding). */
export const FLOATING_TAB_BAR_HEIGHT = 95;

/** Minimum bottom inset for Android 3-button navigation bar. */
export const ANDROID_MIN_BOTTOM_INSET = 48;

export type ScreenInsetsOptions = {
  /** Set true on tab screens (Home, Timeline, Menu, Booking). */
  includeTabBar?: boolean;
};

export function useScreenInsets(options: ScreenInsetsOptions = {}) {
  const insets = useSafeAreaInsets();
  const { includeTabBar = false } = options;

  const bottom =
    Platform.OS === "android"
      ? Math.max(insets.bottom, ANDROID_MIN_BOTTOM_INSET)
      : insets.bottom;

  const tabBarSpace = includeTabBar ? FLOATING_TAB_BAR_HEIGHT : 0;

  return {
    top: insets.top,
    bottom,
    /** Use on ScrollView / FlatList contentContainerStyle paddingBottom */
    scrollPadding: bottom + tabBarSpace + 20,
    /** Use on floating action buttons */
    fabBottom: bottom + tabBarSpace + 16,
    /** Use on bottom-fixed footers inside stack screens */
    footerPadding: bottom + 16,
    /** Use inside modals / bottom sheets */
    modalPadding: bottom + 12,
  };
}

export function getKeyboardAvoidBehavior(): "padding" | "height" {
  return Platform.OS === "ios" ? "padding" : "height";
}
