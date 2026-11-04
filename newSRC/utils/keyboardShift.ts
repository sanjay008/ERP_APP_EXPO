import { useEffect } from "react";
import { Keyboard, Platform, type KeyboardEvent } from "react-native";
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

function keyboardHeight(event: KeyboardEvent) {
  return Math.max(0, event.endCoordinates?.height || 0);
}

/** Smooth lift for modals and bottom actions. Full screens on Android already resize. */
export function useKeyboardLiftStyle(active = true) {
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      lift.value = withTiming(0, { duration: 180 });
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const duration = Platform.OS === "ios" ? event.duration || 250 : 220;
      lift.value = withTiming(keyboardHeight(event), { duration });
    });
    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      const duration = Platform.OS === "ios" ? event.duration || 220 : 180;
      lift.value = withTiming(0, { duration });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [active, lift]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value }],
  }));
}

/** Extra scroll space so the focused field can move above the keyboard on iOS. */
export function useKeyboardPaddingStyle(active = true) {
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      lift.value = withTiming(0, { duration: 180 });
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const duration = Platform.OS === "ios" ? event.duration || 250 : 220;
      const next = Platform.OS === "android" ? 0 : keyboardHeight(event);
      lift.value = withTiming(next, { duration });
    });
    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      const duration = Platform.OS === "ios" ? event.duration || 220 : 180;
      lift.value = withTiming(0, { duration });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [active, lift]);

  return useAnimatedStyle(() => ({
    paddingBottom: lift.value,
  }));
}
