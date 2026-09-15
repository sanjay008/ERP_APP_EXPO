import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import FallBackImage from "./FallBackImage";
import { Images } from "../utils/Images";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import { LIST_UI } from "../utils/connectionTheme";

type Props = {
  title: string;
  onBack?: () => void;
  refreshOnPress?: () => void;
  filterOnPress?: () => void;
  /** @deprecated use filterOnPress */
  sortOnPress?: () => void;
};

export default function ScreenHeader({
  title,
  onBack,
  refreshOnPress,
  filterOnPress,
  sortOnPress,
}: Props) {
  const router = useRouter();
  const onFilter = filterOnPress ?? sortOnPress;
  const showActions = Boolean(refreshOnPress || onFilter);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <FallBackImage
            source={Images.BackIcon}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {showActions ? (
        <View style={styles.actions}>
          {onFilter ? (
            <Pressable style={styles.actionBtn} onPress={onFilter}>
              <FallBackImage
                source={Images.FilterIcon}
                style={styles.actionIcon}
                resizeMode="contain"
                tintColor="#FFFFFF"
              />
            </Pressable>
          ) : null}
          {refreshOnPress ? (
            <Pressable style={styles.actionBtn} onPress={refreshOnPress}>
              <FallBackImage
                source={Images.RefreshIcon}
                style={styles.actionIcon}
                resizeMode="contain"
                tintColor="#FFFFFF"
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: LIST_UI.headerPaddingV,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 12,
  },
  backBtn: {
    width: LIST_UI.buttonSize,
    height: LIST_UI.buttonSize,
    borderRadius: LIST_UI.radiusButton,
    backgroundColor: LIST_UI.surface,
    borderWidth: 1,
    borderColor: LIST_UI.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 17,
    color: AppColors.black,
    textAlign: "left",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    width: LIST_UI.buttonSize,
    height: LIST_UI.buttonSize,
    borderRadius: LIST_UI.radiusButton,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    width: 18,
    height: 18,
  },
});
