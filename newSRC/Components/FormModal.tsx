import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { useScreenInsets } from "../utils/screenInsets";
import { useKeyboardLiftStyle } from "../utils/keyboardShift";
import { ignoreHardwareBack } from "../utils/modalBack";
import { AppColors } from "../utils/theme";

type Props = ModalProps & {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  /** When true, Android back and the backdrop do not dismiss the modal. */
  protected?: boolean;
};

export default function FormModal({
  visible,
  onClose,
  children,
  contentStyle,
  scrollable = false,
  protected: isProtected = true,
  animationType = "fade",
  transparent = true,
  ...rest
}: Props) {
  const { modalPadding } = useScreenInsets();
  const liftStyle = useKeyboardLiftStyle(visible);

  return (
    <Modal
      {...rest}
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={isProtected ? ignoreHardwareBack : onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { marginBottom: modalPadding }, liftStyle, contentStyle]}>
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
        </Animated.View>
      </View>
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
