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

  const bottom =
    Platform.OS === "android"
      ? Math.max(insets.bottom, ANDROID_MIN_BOTTOM_INSET)
      : insets.bottom;

  const tabBarSpace = includeTabBar ? FLOATING_TAB_BAR_HEIGHT : 0;

  return {
    top: insets.top,
    bottom,
    /** Use on ScrollView / FlatList contentContainerStyle paddingBottom */
    scrollPadding: bottom + tabBarSpace + 24,
    /** Use on floating action buttons */
    fabBottom: bottom + tabBarSpace + 16,
    /** Use on bottom-fixed footers inside stack screens */
    footerPadding: bottom + 16,
    /** Use inside modals / bottom sheets */
    modalPadding: bottom + 16,
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
