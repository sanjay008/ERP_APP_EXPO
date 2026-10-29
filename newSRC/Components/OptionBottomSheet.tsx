import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useScreenInsets } from "../utils/screenInsets";
import SelectionListItem from "./SelectionListItem";
import SimpleBox from "./SimpleBox";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export type OptionItem = {
  id: string;
  label: string;
};

type Props = {
  visible: boolean;
  title: string;
  confirmText?: string;
  options: OptionItem[];
  onClose: () => void;
  onConfirm: (option: OptionItem) => void;
};

function OptionBottomSheet({
  visible,
  title,
  options,
  onClose,
  onConfirm,
}: Props) {
  const { footerPadding } = useScreenInsets();
  const [mounted, setMounted] = useState(false);
  const sheetHeight = Math.min(SCREEN_HEIGHT * 0.42, 88 + options.length * 52);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(sheetHeight);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, sheetHeight, translateY, backdropOpacity]);

  const handleSelect = useCallback(
    (item: OptionItem) => {
      onConfirm(item);
      onClose();
    },
    [onClose, onConfirm]
  );

  if (!visible && !mounted) return null;

  return (
    <Modal
      visible={visible || mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
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

          <View>
            {options.map((item) => (
              <SelectionListItem
                key={item.id}
                label={item.label}
                selected={false}
                showCheckbox={false}
                onPress={() => handleSelect(item)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default React.memo(OptionBottomSheet);

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
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
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
});
