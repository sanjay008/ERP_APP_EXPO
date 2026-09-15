import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useScreenInsets } from "../utils/screenInsets";
import SimpleBox from "./SimpleBox";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.32;

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function ConfirmBottomSheet({
  visible,
  title,
  message,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const { footerPadding } = useScreenInsets();
  const [mounted, setMounted] = useState(false);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, translateY, backdropOpacity, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onClose}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: footerPadding, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <SimpleBox
              Icon={Images.CloseIcon}
              onPress={onClose}
              style={styles.closeBtn}
              IconStyle={{ width: 14, height: 14, tintColor: Colors.white }}
            />
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default React.memo(ConfirmBottomSheet);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: SHEET_HEIGHT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.dicline,
    borderColor: Colors.dicline,
  },
  message: {
    fontSize: 15,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: Colors.SquareBtnBG,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.dicline,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.white,
  },
});
