import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useScreenInsets } from "../utils/screenInsets";
import RichDescriptionEditor from "./RichDescriptionEditor";
import SimpleBox from "./SimpleBox";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_SLIDE_DISTANCE = SCREEN_HEIGHT * 0.5;

type Props = {
  visible: boolean;
  title: string;
  fieldLabel?: string;
  placeholder: string;
  value: string;
  error?: string;
  loading?: boolean;
  editorKey?: string | number;
  onChange: (html: string) => void;
  onClose: () => void;
  onSave: () => void;
  saveText?: string;
};

function InputBottomSheet({
  visible,
  title,
  fieldLabel,
  placeholder,
  value,
  error,
  loading = false,
  editorKey,
  onChange,
  onClose,
  onSave,
  saveText = "Save Note",
}: Props) {
  const { footerPadding } = useScreenInsets();
  const [mounted, setMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const slideY = useRef(new Animated.Value(SHEET_SLIDE_DISTANCE)).current;
  const keyboardShift = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const sheetTranslateY = useRef(Animated.add(slideY, keyboardShift)).current;

  useEffect(() => {
    if (!visible) {
      keyboardShift.setValue(0);
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const windowHeight = Dimensions.get("window").height;
      const keyboardTop = event?.endCoordinates?.screenY ?? windowHeight;
      const height = Math.max(windowHeight - keyboardTop, event?.endCoordinates?.height || 0);

      setKeyboardHeight(height);
      Animated.timing(keyboardShift, {
        toValue: -height,
        duration: event?.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      setKeyboardHeight(0);
      Animated.timing(keyboardShift, {
        toValue: 0,
        duration: event?.duration || 220,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible, keyboardShift]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      keyboardShift.setValue(0);
      setKeyboardHeight(0);
      Animated.parallel([
        Animated.timing(slideY, {
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

    Animated.parallel([
      Animated.timing(slideY, {
        toValue: SHEET_SLIDE_DISTANCE,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(keyboardShift, {
        toValue: 0,
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
        setKeyboardHeight(0);
      }
    });
  }, [visible, slideY, keyboardShift, backdropOpacity]);

  const handleClose = () => {
    if (loading) {
      return;
    }
    Keyboard.dismiss();
    onClose();
  };

  if (!mounted) {
    return null;
  }

  const sheetPaddingBottom = keyboardHeight > 0 ? 12 : footerPadding;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: sheetPaddingBottom,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <SimpleBox
              Icon={Images.CloseIcon}
              onPress={handleClose}
              style={[styles.closeBtn, loading && styles.closeBtnDisabled]}
              IconStyle={{ width: 14, height: 14, tintColor: Colors.white }}
            />
          </View>
          <View style={styles.content}>
            {fieldLabel ? <Text style={styles.fieldLabel}>{fieldLabel}</Text> : null}

            <RichDescriptionEditor
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              error={Boolean(error)}
              disabled={loading}
              compact
              contentKey={editorKey}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={onSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveText}>{saveText}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default React.memo(InputBottomSheet);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: Colors.white,
    width: "100%",
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 4,
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: Colors.gray,
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
  closeBtnDisabled: {
    opacity: 0.5,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
    marginBottom: 8,
  },
  errorText: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 12,
    fontFamily: FONTS.OutfitRegular,
    color: Colors.dicline,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  saveBtnDisabled: {
    opacity: 0.85,
  },
  saveText: {
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.white,
  },
});
