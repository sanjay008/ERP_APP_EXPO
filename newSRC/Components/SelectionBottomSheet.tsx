import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useScreenInsets } from "../utils/screenInsets";
import SearchBox from "./SearchBox";
import SelectionListItem from "./SelectionListItem";
import SimpleBox from "./SimpleBox";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

export type SheetOption = {
  id: string | number;
  label: string;
  raw?: any;
};

type Props = {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  confirmText: string;
  options: SheetOption[];
  selectedIds: Array<string | number>;
  multiSelect?: boolean;
  onClose: () => void;
  onConfirm: (selected: SheetOption[]) => void;
};

function SelectionBottomSheet({
  visible,
  title,
  searchPlaceholder,
  confirmText,
  options,
  selectedIds,
  multiSelect = false,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const { footerPadding } = useScreenInsets();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<Array<string | number>>(selectedIds);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setDraftIds(selectedIds);
      setSearch("");
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
  }, [visible, selectedIds, translateY, backdropOpacity]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((item) => item.label.toLowerCase().includes(query));
  }, [options, search]);

  const isSelected = useCallback(
    (id: string | number) => draftIds.some((item) => String(item) === String(id)),
    [draftIds]
  );

  const toggleItem = useCallback((option: SheetOption) => {
    setDraftIds((prev) => {
      const exists = prev.some((id) => String(id) === String(option.id));
      if (multiSelect) {
        if (exists) {
          return prev.filter((id) => String(id) !== String(option.id));
        }
        return [...prev, option.id];
      }
      if (exists) {
        return [];
      }
      return [option.id];
    });
  }, [multiSelect]);

  const handleConfirm = useCallback(() => {
    const selected = options.filter((item) =>
      draftIds.some((id) => String(id) === String(item.id))
    );
    onConfirm(selected);
    onClose();
  }, [draftIds, onClose, onConfirm, options]);

  if (!visible && !mounted) {
    return null;
  }

  return (
    <Modal
      visible={visible || mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
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

        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={searchPlaceholder}
          onClear={() => setSearch("")}
          containerStyle={styles.searchBox}
        />

        <FlatList
          data={filteredOptions}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t("No Data Found")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SelectionListItem
              label={item.label}
              selected={isSelected(item.id)}
              onPress={() => toggleItem(item)}
            />
          )}
        />

        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>{confirmText}</Text>
        </Pressable>
      </Animated.View>
      </View>
    </Modal>
  );
}

export default React.memo(SelectionBottomSheet);

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
    height: SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  searchBox: {
    minHeight: 46,
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.placeholder,
  },
  confirmBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: FONTS.OutfitSemiBold,
  },
});
