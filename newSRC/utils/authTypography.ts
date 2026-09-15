import { StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "./FONTS";
import { AppColors } from "./theme";

export const AUTH_PLACEHOLDER_COLOR = "#A0A8B3";
export const AUTH_ERROR_COLOR = "#EF4444";

export const authTypography = StyleSheet.create({
  title: {
    fontFamily: FONTS.LexendBold,
    fontSize: RFValue(22),
    lineHeight: RFValue(28),
    color: AppColors.black,
    textAlign: "left",
  },
  subtitle: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(13),
    lineHeight: RFValue(18),
    color: AppColors.subtitle,
    textAlign: "left",
    marginTop: 6,
    marginBottom: 12,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(12),
    lineHeight: RFValue(16),
    color: AppColors.black,
    textAlign: "left",
    marginBottom: 8,
  },
  input: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(14),
    lineHeight: RFValue(20),
    color: AppColors.black,
  },
  selectValue: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(14),
    lineHeight: RFValue(20),
    color: AppColors.black,
  },
  placeholder: {
    color: AUTH_PLACEHOLDER_COLOR,
  },
  button: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: RFValue(15),
    lineHeight: RFValue(20),
    color: AppColors.white,
    textAlign: "center",
  },
  backLink: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(13),
    lineHeight: RFValue(18),
    color: AppColors.primary,
    textAlign: "left",
  },
  link: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(14),
    lineHeight: RFValue(20),
    color: AppColors.primary,
    textAlign: "center",
  },
  secondaryAction: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(14),
    lineHeight: RFValue(20),
    color: AppColors.black,
    textAlign: "center",
  },
  resend: {
    fontFamily: FONTS.LexendMedium,
    fontSize: RFValue(13),
    lineHeight: RFValue(18),
    color: AppColors.subtitle,
    textAlign: "center",
  },
  error: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(11),
    lineHeight: RFValue(14),
    color: AUTH_ERROR_COLOR,
    textAlign: "left",
  },
  errorCenter: {
    fontFamily: FONTS.LexendRegular,
    fontSize: RFValue(11),
    lineHeight: RFValue(14),
    color: AUTH_ERROR_COLOR,
    textAlign: "center",
    marginTop: 8,
  },
  required: {
    color: AUTH_ERROR_COLOR,
  },
  otpChar: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: RFValue(20),
    lineHeight: RFValue(24),
    color: AppColors.black,
    textAlign: "center",
  },
});
