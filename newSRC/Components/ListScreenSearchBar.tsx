import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import SearchBox from "./SearchBox";
import { listScreenStyles } from "../utils/listScreenStyles";
import { LIST_UI } from "../utils/connectionTheme";
import { AppColors } from "../utils/theme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  wrapStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function ListScreenSearchBar({
  value,
  onChangeText,
  placeholder,
  onClear,
  wrapStyle,
  containerStyle,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={[listScreenStyles.searchWrap, wrapStyle]}>
      <SearchBox
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t("Search")}
        onClear={onClear ?? (() => onChangeText(""))}
        containerStyle={[
          {
            minHeight: LIST_UI.searchHeight,
            borderRadius: LIST_UI.radiusSearch,
            borderColor: LIST_UI.cardBorder,
            backgroundColor: AppColors.white,
          },
          containerStyle,
        ]}
      />
    </View>
  );
}
