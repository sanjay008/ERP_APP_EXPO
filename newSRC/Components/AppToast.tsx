import React, { useContext, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RegisterBackContext } from "../constants/GoBackContext";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";

export default function AppToast() {
  const { toast, clearToast } = useContext(RegisterBackContext);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast?.visible) return;
    const timer = setTimeout(() => clearToast(), 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast?.visible) return null;

  const isError = toast.type === "error";

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Pressable
        style={[
          styles.toast,
          {
            top: toast.top ?? insets.top + 8,
            backgroundColor: isError ? "#D14343" : AppColors.primary,
          },
        ]}
        onPress={clearToast}
      >
        <Text style={styles.text}>{toast.text}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 9999,
    elevation: 8,
  },
  text: {
    color: AppColors.white,
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    textAlign: "center",
  },
});
