import React, { useEffect, useRef, type ReactNode } from "react";
import {
  findNodeHandle,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { useKeyboardLiftStyle, useKeyboardPaddingStyle } from "../utils/keyboardShift";

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  active?: boolean;
};

/** Keeps form fields and bottom actions above the keyboard with a Reanimated shift. */
export default function KeyboardScreen({
  children,
  footer,
  contentContainerStyle,
  active = true,
}: Props) {
  const paddingStyle = useKeyboardPaddingStyle(active);
  const footerLift = useKeyboardLiftStyle(active && Platform.OS === "ios");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!active) return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(showEvent, () => {
      requestAnimationFrame(() => {
        const input = TextInput.State.currentlyFocusedInput?.();
        const scrollNode = findNodeHandle(scrollRef.current);
        if (!input || !scrollNode || !scrollRef.current) return;
        input.measureLayout(
          scrollNode,
          (_x, y) => {
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
          },
          () => {}
        );
      });
    });
    return () => sub.remove();
  }, [active]);

  return (
    <View style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={paddingStyle}>{children}</Animated.View>
      </ScrollView>
      {footer ? <Animated.View style={footerLift}>{footer}</Animated.View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
