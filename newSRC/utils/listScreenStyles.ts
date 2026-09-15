import { StyleSheet, type ViewStyle } from "react-native";
import { FONTS } from "./FONTS";
import { AppColors } from "./theme";
import { LIST_UI } from "./connectionTheme";

export const LIST_CARD_SHADOW: ViewStyle = {
  shadowColor: "#000000",
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 5 },
  shadowRadius: 15,
  elevation: 3,
};

export const listScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIST_UI.pageBackground,
  },
  searchWrap: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: LIST_UI.cardBorder,
  },
  list: {
    flex: 1,
    backgroundColor: LIST_UI.pageBackground,
  },
  listContent: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: LIST_UI.listTop,
    flexGrow: 1,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: LIST_UI.cardRadius,
    padding: LIST_UI.cardPadding,
    marginBottom: LIST_UI.cardGap,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    ...LIST_CARD_SHADOW,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: LIST_UI.cardHeight,
    backgroundColor: AppColors.white,
    padding: LIST_UI.cardPadding,
    borderRadius: LIST_UI.cardRadius,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    marginBottom: LIST_UI.cardGap,
    ...LIST_CARD_SHADOW,
  },
  idBox: {
    width: LIST_UI.idBoxSize,
    height: LIST_UI.idBoxSize,
    borderRadius: LIST_UI.iconRadius,
    backgroundColor: LIST_UI.idBoxBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  idText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: AppColors.black,
    textAlign: "center",
  },
  statusBadge: {
    borderRadius: LIST_UI.iconRadius,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 11,
    color: AppColors.white,
    textAlign: "center",
  },
  avatarFrame: {
    width: LIST_UI.iconSize,
    height: LIST_UI.iconSize,
    borderRadius: LIST_UI.iconRadius,
    overflow: "hidden",
    backgroundColor: LIST_UI.surface,
  },
  detailContent: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: LIST_UI.listTop,
  },
  detailCard: {
    backgroundColor: AppColors.white,
    borderRadius: LIST_UI.cardRadius,
    borderWidth: 1,
    borderColor: LIST_UI.cardBorder,
    padding: LIST_UI.cardPadding,
    marginBottom: LIST_UI.cardGap,
    ...LIST_CARD_SHADOW,
  },
});
