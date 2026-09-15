import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useScreenInsets } from "../utils/screenInsets";
import { useTranslation } from "react-i18next";
import SelectionListItem from "./SelectionListItem";
import SimpleBox from "./SimpleBox";
import { Colors } from "../utils/colors";
import { FONTS } from "../utils/FONTS";
import { Images } from "../utils/Images";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.68;

export type SortOrder = "default" | "asc" | "desc";

export type TicketFilterState = {
  sortOrder: SortOrder;
  statusIds: Array<string | number>;
};

export type StatusOption = {
  id: string | number;
  status_name: string;
  color?: string;
};

type Props = {
  visible: boolean;
  statusOptions: StatusOption[];
  initialFilters: TicketFilterState;
  onClose: () => void;
  onApply: (filters: TicketFilterState) => void;
};

const SORT_OPTIONS: Array<{ id: SortOrder; labelKey: string }> = [
  { id: "default", labelKey: "Default" },
  { id: "asc", labelKey: "ID Ascending" },
  { id: "desc", labelKey: "ID Descending" },
];

function TicketFilterBottomSheet({
  visible,
  statusOptions,
  initialFilters,
  onClose,
  onApply,
}: Props) {
  const { t } = useTranslation();
  const { footerPadding } = useScreenInsets();
  const [mounted, setMounted] = useState(false);
  const [draftSort, setDraftSort] = useState<SortOrder>(initialFilters.sortOrder);
  const [draftStatusIds, setDraftStatusIds] = useState<Array<string | number>>(
    initialFilters.statusIds
  );

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setDraftSort(initialFilters.sortOrder);
      setDraftStatusIds(initialFilters.statusIds);
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
  }, [visible, initialFilters, translateY, backdropOpacity]);

  const toggleStatus = (statusId: string | number) => {
    setDraftStatusIds((prev) => {
      const exists = prev.some((id) => String(id) === String(statusId));
      if (exists) {
        return prev.filter((id) => String(id) !== String(statusId));
      }
      return [...prev, statusId];
    });
  };

  const handleReset = () => {
    setDraftSort("default");
    setDraftStatusIds([]);
  };

  const handleApply = () => {
    onApply({
      sortOrder: draftSort,
      statusIds: draftStatusIds,
    });
    onClose();
  };

  if (!visible || !mounted) {
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
          <Text style={styles.title}>{t("Filter")}</Text>
          <SimpleBox
            Icon={Images.CloseIcon}
            onPress={onClose}
            style={styles.closeBtn}
            IconStyle={{ width: 14, height: 14, tintColor: Colors.white }}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>{t("Sort By ID")}</Text>
          {SORT_OPTIONS.map((option) => (
            <SelectionListItem
              key={option.id}
              label={t(option.labelKey)}
              selected={draftSort === option.id}
              onPress={() => setDraftSort(option.id)}
            />
          ))}

          <Text style={[styles.sectionTitle, styles.sectionGap]}>{t("Status")}</Text>
          {statusOptions.length === 0 ? (
            <Text style={styles.emptyText}>{t("No Data Found")}</Text>
          ) : (
            statusOptions.map((statusItem) => (
              <SelectionListItem
                key={String(statusItem.id)}
                label={t(statusItem.status_name)}
                selected={draftStatusIds.some(
                  (id) => String(id) === String(statusItem.id)
                )}
                onPress={() => toggleStatus(statusItem.id)}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>{t("Reset")}</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>{t("Apply Filter")}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

export default React.memo(TicketFilterBottomSheet);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 24,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Colors.white,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
    marginBottom: 4,
    marginTop: 8,
  },
  sectionGap: {
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.OutfitMedium,
    color: Colors.placeholder,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  resetBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  resetText: {
    fontSize: 15,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.black,
  },
  applyBtn: {
    flex: 1.4,
    minHeight: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  applyText: {
    fontSize: 15,
    fontFamily: FONTS.OutfitSemiBold,
    color: Colors.white,
  },
});
