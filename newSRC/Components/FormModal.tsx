import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useScreenInsets, getKeyboardAvoidBehavior } from "../utils/screenInsets";
import { AppColors } from "../utils/theme";

type Props = ModalProps & {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
};

export default function FormModal({
  visible,
  onClose,
  children,
  contentStyle,
  scrollable = false,
  animationType = "fade",
  transparent = true,
  ...rest
}: Props) {
  const { modalPadding } = useScreenInsets();

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onClose}
      {...rest}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={getKeyboardAvoidBehavior()}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[styles.card, { marginBottom: modalPadding }, contentStyle]}
            onPress={(e) => e.stopPropagation()}
          >
            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
  },
});
