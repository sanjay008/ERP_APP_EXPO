import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.42;

export type OptionItem = {
  id: string;
  label: string;
};

type Props = {
  visible: boolean;
  title: string;
  confirmText: string;
  options: OptionItem[];
  onClose: () => void;
  onConfirm: (option: OptionItem) => void;
};

function OptionBottomSheet({
  visible,
  title,
  confirmText,
  options,
  onClose,
  onConfirm,
}: Props) {
  const { footerPadding } = useScreenInsets();
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setSelectedId(null);
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
          toValue: SHEET_HEIGHT,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, translateY, backdropOpacity]);

  const handleConfirm = useCallback(() => {
    const selected = options.find((item) => item.id === selectedId);
    if (!selected) {
      return;
    }
    onConfirm(selected);
    onClose();
  }, [onClose, onConfirm, options, selectedId]);

  if (!visible) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  return (
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

        <View style={styles.list}>
          {options.map((item) => (
            <SelectionListItem
              key={item.id}
              label={item.label}
              selected={selectedId === item.id}
              onPress={() => setSelectedId(item.id)}
            />
          ))}
        </View>

        <Pressable
          style={[styles.confirmBtn, !selectedId && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedId}
        >
          <Text style={styles.confirmText}>{confirmText}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default React.memo(OptionBottomSheet);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 20,
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
  list: {
    flexGrow: 1,
  },
  confirmBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
  },
});
