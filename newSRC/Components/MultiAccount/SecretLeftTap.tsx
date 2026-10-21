import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAP_GOAL = 6;
const TAP_WINDOW_MS = 2200;

type Props = {
  onUnlock: () => void;
};

export default function SecretLeftTap({ onUnlock }: Props) {
  const insets = useSafeAreaInsets();
  const taps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = useCallback(() => {
    taps.current = 0;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => () => reset(), [reset]);

  const handlePress = () => {
    taps.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(reset, TAP_WINDOW_MS);

    if (taps.current >= TAP_GOAL) {
      reset();
      onUnlock();
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel=""
      onPress={handlePress}
      style={[styles.zone, { top: insets.top }]}
    />
  );
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    left: 0,
    width: 56,
    height: 56,
    zIndex: 80,
    elevation: 80,
  },
});
