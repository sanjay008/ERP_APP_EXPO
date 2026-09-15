import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import {
  filterCountriesByQuery,
  filterCountriesWithCallingCode,
  findCountryByCode,
  getPhoneLengthRules,
  MergedCountry,
  normalizePhoneForCountry,
} from "../../utils/countryListHelper";
import { AUTH_PLACEHOLDER_COLOR, authTypography } from "../../utils/authTypography";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { RFValue } from "react-native-responsive-fontsize";

const SEARCH_BAR_HEIGHT = 44;
const ROW_HEIGHT = 44;
const BOTTOM_INSET = 12;
const MIN_LIST_HEIGHT = ROW_HEIGHT * 3;
const MIN_DROPDOWN_HEIGHT = SEARCH_BAR_HEIGHT + MIN_LIST_HEIGHT;

type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DropdownLayout = {
  top: number;
  left: number;
  width: number;
  height: number;
  opensAbove: boolean;
};

type CountryPickerProps = {
  value?: string;
  setValue?: (text: string) => void;
  countryCode?: string;
  countries: MergedCountry[];
  onSelect?: (country: MergedCountry) => void;
  onOpenChange?: (open: boolean) => void;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  placeholder?: string;
};

type ListItem = MergedCountry & { _showDivider?: boolean };

const getPreferredMaxHeight = () => {
  const screenH = Dimensions.get("window").height;
  return Math.round(Math.min(Math.max(screenH * 0.42, 280), 400));
};

const computeDropdownLayout = (
  anchor: AnchorRect,
  keyboardHeight = 0
): DropdownLayout => {
  const { height: screenH, width: screenW } = Dimensions.get("window");
  const preferredMax = getPreferredMaxHeight();
  const visibleBottom = screenH - keyboardHeight - BOTTOM_INSET;
  const spaceBelow = visibleBottom - (anchor.y + anchor.height);
  const spaceAbove = anchor.y - BOTTOM_INSET;

  let opensAbove = false;
  let height = preferredMax;
  let top = anchor.y + anchor.height;

  if (spaceBelow >= MIN_DROPDOWN_HEIGHT) {
    height = Math.min(preferredMax, spaceBelow);
    top = anchor.y + anchor.height;
  } else if (spaceAbove >= MIN_DROPDOWN_HEIGHT && spaceAbove > spaceBelow) {
    opensAbove = true;
    height = Math.min(preferredMax, spaceAbove);
    top = anchor.y - height;
  } else if (spaceBelow >= spaceAbove) {
    height = Math.max(MIN_DROPDOWN_HEIGHT, Math.min(preferredMax, spaceBelow));
    top = anchor.y + anchor.height;
  } else {
    opensAbove = true;
    height = Math.max(MIN_DROPDOWN_HEIGHT, Math.min(preferredMax, spaceAbove));
    top = Math.max(BOTTOM_INSET, anchor.y - height);
  }

  const horizontalInset = 8;
  const left = Math.max(
    horizontalInset,
    Math.min(anchor.x, screenW - anchor.width - horizontalInset)
  );
  const width = Math.min(anchor.width, screenW - left - horizontalInset);

  return { top, left, width, height, opensAbove };
};

function CountryRow({
  item,
  isSelected,
  onPick,
}: {
  item: MergedCountry;
  isSelected: boolean;
  onPick: (country: MergedCountry) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dropdownRow,
        pressed && styles.dropdownRowPressed,
        isSelected && styles.dropdownRowActive,
      ]}
      onPress={() => onPick(item)}
    >
      <Text style={styles.rowFlag}>{item.flag}</Text>
      <Text style={[authTypography.selectValue, styles.rowName]} numberOfLines={1}>
        {item.name}
      </Text>
      {item.countrycode ? <Text style={styles.rowCode}>+{item.countrycode}</Text> : null}
    </Pressable>
  );
}

export default function CountryPicker({
  value = "",
  setValue,
  countryCode = "31",
  countries,
  onSelect,
  onOpenChange,
  containerStyle,
  disabled = false,
  placeholder = "Enter whatsapp number",
}: CountryPickerProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<MergedCountry | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownLayout, setDropdownLayout] = useState<DropdownLayout>({
    top: 0,
    left: 0,
    width: 0,
    height: getPreferredMaxHeight(),
    opensAbove: false,
  });
  const anchorRef = useRef<View>(null);
  const keyboardHeightRef = useRef(0);

  const selectableCountries = useMemo(
    () => filterCountriesWithCallingCode(countries),
    [countries]
  );

  const phoneRules = useMemo(
    () => getPhoneLengthRules(selected?.countrycode ?? countryCode ?? "31"),
    [selected?.countrycode, countryCode]
  );

  useEffect(() => {
    if (!selectableCountries.length) return;
    const match = findCountryByCode(selectableCountries, countryCode);
    if (match) setSelected(match);
  }, [selectableCountries, countryCode]);

  useEffect(() => {
    if (String(countryCode ?? "31") !== "31") return;
    if (String(value ?? "").trim() !== "") return;
    setValue?.("06");
  }, [countryCode, value, setValue]);

  const updateDropdownLayout = useCallback((keyboardHeight = 0) => {
    keyboardHeightRef.current = keyboardHeight;
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout(computeDropdownLayout({ x, y, width, height }, keyboardHeight));
    });
  }, []);

  const setOpenState = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  const flatListData = useMemo((): ListItem[] => {
    if (!selectableCountries.length) return [];

    const trimmedSearch = searchQuery.trim();
    if (trimmedSearch) {
      return filterCountriesByQuery(selectableCountries, trimmedSearch).sort((a, b) => {
        if (b.favorite !== a.favorite) return b.favorite - a.favorite;
        return a.name.localeCompare(b.name);
      });
    }

    const favorites = selectableCountries.filter((c) => c.favorite === 1);
    const others = selectableCountries.filter((c) => c.favorite !== 1);

    if (others.length === 0) return favorites;
    if (favorites.length === 0) return others;

    return [
      ...favorites,
      ...others.map((item, index) => ({
        ...item,
        _showDivider: index === 0,
      })),
    ];
  }, [selectableCountries, searchQuery]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setSearchQuery("");
    keyboardHeightRef.current = 0;
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout(computeDropdownLayout({ x, y, width, height }, 0));
      setOpenState(true);
    });
  }, [disabled, setOpenState]);

  const closeDropdown = useCallback(() => {
    setSearchQuery("");
    keyboardHeightRef.current = 0;
    setOpenState(false);
  }, [setOpenState]);

  useEffect(() => {
    if (!open) return;

    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(keyboardShowEvent, (event) => {
      updateDropdownLayout(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(keyboardHideEvent, () => {
      updateDropdownLayout(0);
    });
    const dimensionSub = Dimensions.addEventListener("change", () => {
      updateDropdownLayout(keyboardHeightRef.current);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      dimensionSub.remove();
    };
  }, [open, updateDropdownLayout]);

  const handlePick = useCallback(
    (country: MergedCountry) => {
      const newCode = String(country.countrycode);
      setSelected(country);
      onSelect?.(country);

      if (newCode === "31") {
        setValue?.("06");
      } else {
        const currentDigits = (value ?? "").replace(/\D/g, "");
        if (currentDigits === "06") {
          setValue?.("");
        } else {
          setValue?.(normalizePhoneForCountry(newCode, value ?? ""));
        }
      }
      closeDropdown();
    },
    [onSelect, closeDropdown, setValue, value]
  );

  const handlePhoneChange = useCallback(
    (text: string) => {
      const code = selected?.countrycode ?? countryCode ?? "31";
      setValue?.(normalizePhoneForCountry(String(code), text));
    },
    [selected?.countrycode, countryCode, setValue]
  );

  return (
    <>
      <View style={[styles.wrapper, containerStyle]}>
        <View ref={anchorRef} collapsable={false} style={styles.inputRow}>
          <Pressable disabled={disabled} style={styles.codeBtn} onPress={openDropdown}>
            <Text style={styles.flagText}>{selected?.flag ?? "🏳️"}</Text>
            <Text style={styles.callingCodeText}>
              +{selected?.countrycode ?? countryCode}
            </Text>
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={14}
              color={AppColors.black}
            />
          </Pressable>

          <TextInput
            key={`phone-input-${selected?.countrycode ?? countryCode}`}
            style={[authTypography.input, styles.phoneInput]}
            value={value}
            onChangeText={handlePhoneChange}
            placeholder={placeholder}
            keyboardType="number-pad"
            editable={!disabled}
            maxLength={phoneRules.max}
            placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
            onFocus={closeDropdown}
          />
        </View>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeDropdown}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeDropdown} />

          <View
            style={[
              styles.modalDropdown,
              dropdownLayout.opensAbove
                ? styles.modalDropdownAbove
                : styles.modalDropdownBelow,
              {
                top: dropdownLayout.top,
                left: dropdownLayout.left,
                width: dropdownLayout.width,
                height: dropdownLayout.height,
              },
            ]}
          >
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={AppColors.subtitle} style={styles.searchIcon} />
              <TextInput
                style={[authTypography.input, styles.searchInput]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t("Search country")}
                placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8} style={styles.searchClearBtn}>
                  <Ionicons name="close-circle" size={18} color={AppColors.subtitle} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={flatListData}
              keyExtractor={(item, index) => `${item.apiId ?? item.cca2}-${item.countrycode}-${index}`}
              renderItem={({ item }) => (
                <View>
                  {item._showDivider ? <View style={styles.dropdownDivider} /> : null}
                  <CountryRow
                    item={item}
                    isSelected={
                      selected?.countrycode === item.countrycode &&
                      selected?.cca2 === item.cca2
                    }
                    onPick={handlePick}
                  />
                </View>
              )}
              style={[
                styles.dropdownList,
                { height: Math.max(MIN_LIST_HEIGHT, dropdownLayout.height - SEARCH_BAR_HEIGHT) },
              ]}
              contentContainerStyle={styles.dropdownListContent}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator
              nestedScrollEnabled
              initialNumToRender={20}
              windowSize={10}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{t("No countries found")}</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    backgroundColor: AppColors.white,
    minHeight: 52,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 52,
    paddingHorizontal: 4,
  },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingRight: 12,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    minHeight: 52,
  },
  flagText: {
    fontSize: 20,
  },
  callingCodeText: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    color: AppColors.black,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    minHeight: 52,
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  modalDropdown: {
    position: "absolute",
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: "#D8DEE6",
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalDropdownBelow: {
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  modalDropdownAbove: {
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: SEARCH_BAR_HEIGHT,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: AppColors.white,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    height: SEARCH_BAR_HEIGHT,
  },
  searchClearBtn: {
    marginLeft: 6,
    padding: 2,
  },
  dropdownList: {
    flex: 1,
  },
  dropdownListContent: {
    paddingBottom: 8,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    height: ROW_HEIGHT,
    paddingHorizontal: 12,
    gap: 8,
    width: "100%",
  },
  dropdownRowPressed: {
    backgroundColor: "#F3F4F6",
  },
  dropdownRowActive: {
    backgroundColor: "#EEF2FF",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  rowFlag: {
    fontSize: 18,
    width: 28,
  },
  rowName: {
    flex: 1,
  },
  rowCode: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendMedium,
    color: AppColors.subtitle,
  },
  emptyText: {
    padding: 14,
    textAlign: "center",
    color: AppColors.subtitle,
    fontFamily: FONTS.LexendRegular,
  },
});
