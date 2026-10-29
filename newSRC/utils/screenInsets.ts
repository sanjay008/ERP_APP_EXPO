import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Floating custom tab bar approximate height (Figma 87px bar + top padding). */
export const FLOATING_TAB_BAR_HEIGHT = 95;

/** Fallback when Android reports 0 for the 3-button navigation bar. */
export const ANDROID_MIN_BOTTOM_INSET = 56;

export type ScreenInsetsOptions = {
  /** Set true on tab screens (Home, Timeline, Menu, Booking). */
  includeTabBar?: boolean;
};

export function useScreenInsets(options: ScreenInsetsOptions = {}) {
  const insets = useSafeAreaInsets();
  const { includeTabBar = false } = options;

  const safeBottom = insets.bottom;
  const bottom =
    Platform.OS === "android"
      ? safeBottom > 0
        ? safeBottom
        : ANDROID_MIN_BOTTOM_INSET
      : safeBottom;

  const tabBarSpace = includeTabBar ? FLOATING_TAB_BAR_HEIGHT : 0;
  /** Fixed footers only need real safe-area, not the Android list fallback. */
  const footerBottom = Math.max(safeBottom, 8);

  return {
    top: insets.top,
    bottom,
    /** Use on ScrollView / FlatList contentContainerStyle paddingBottom */
    scrollPadding: bottom + tabBarSpace + 16,
    /** Use on floating action buttons */
    fabBottom: bottom + tabBarSpace + 12,
    /** Use on bottom-fixed footers inside stack screens */
    footerPadding: footerBottom,
    /** Use inside modals / bottom sheets */
    modalPadding: footerBottom,
  };
}

export function getKeyboardAvoidBehavior(): "padding" | "height" {
  return Platform.OS === "ios" ? "padding" : "height";
}

/** Keyboard overlap height. Use as extra bottom padding inside modal sheets. */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: { endCoordinates?: { height?: number; screenY?: number }; duration?: number }) => {
      const windowHeight = Dimensions.get("window").height;
      const keyboardTop = event?.endCoordinates?.screenY ?? windowHeight;
      const next = Math.max(windowHeight - keyboardTop, event?.endCoordinates?.height || 0);
      setHeight(next);
    };

    const onHide = () => setHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
