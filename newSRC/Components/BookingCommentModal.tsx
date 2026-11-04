import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import RichDescriptionEditor from "./RichDescriptionEditor";
import { useScreenInsets } from "../utils/screenInsets";
import { useKeyboardLiftStyle } from "../utils/keyboardShift";
import { ignoreHardwareBack } from "../utils/modalBack";
import { isRichTextEmpty, richTextPayload } from "../utils/richText";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";

export type BookingCommentMode = "public" | "private" | "complete-cash" | "cancel";

type Props = {
  visible: boolean;
  mode: BookingCommentMode;
  loading?: boolean;
  currencySymbol?: string;
  onClose: () => void;
  onSubmit: (payload: { primary: string; secondary?: string }) => void;
};

export default function BookingCommentModal({
  visible,
  mode,
  loading = false,
  currencySymbol = "",
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const { modalPadding } = useScreenInsets();
  const liftStyle = useKeyboardLiftStyle(visible);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");

  useEffect(() => {
    if (visible) {
      setPrimary("");
      setSecondary("");
    }
  }, [visible, mode]);

  const title =
    mode === "private"
      ? t("Private Comment")
      : mode === "complete-cash"
        ? t("How much did you receive?")
        : mode === "cancel"
          ? t("Cancel Booking ?")
          : t("Voeg een notitie toe");

  const primaryLabel =
    mode === "complete-cash" ? t("Amount") : mode === "private" ? t("Comment") : t("Comment");

  const handleSubmit = () => {
    onSubmit({
      primary: mode === "complete-cash" ? primary.trim() : richTextPayload(primary),
      secondary: isRichTextEmpty(secondary) ? undefined : richTextPayload(secondary),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={ignoreHardwareBack}
    >
        <View style={styles.backdrop}>
          <Animated.View style={[styles.sheet, { marginBottom: modalPadding }, liftStyle]}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.label}>{primaryLabel}</Text>
          {mode === "complete-cash" ? (
            <TextInput
              style={styles.amountInput}
              value={primary}
              onChangeText={setPrimary}
              keyboardType="decimal-pad"
              placeholder={`${currencySymbol} 0.00`}
              placeholderTextColor={AppColors.subtitle}
            />
          ) : (
            <RichDescriptionEditor
              value={primary}
              contentKey={`${mode}-${visible}`}
              placeholder={t("Enter comment")}
              disabled={loading}
              compact
              onChange={setPrimary}
            />
          )}

          {mode === "complete-cash" ? (
            <>
              <Text style={styles.label}>{t("Voeg een notitie toe")}</Text>
              <RichDescriptionEditor
                value={secondary}
                contentKey={`cash-${visible}`}
                placeholder={t("Enter comment")}
                disabled={loading}
                compact
                onChange={setSecondary}
              />
            </>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{t("Annuleren")}</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.saveText}>
                {mode === "complete-cash"
                  ? t("Complete")
                  : mode === "cancel"
                    ? t("Cancel")
                    : t("Notitie")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 17,
    color: AppColors.black,
    marginBottom: 12,
  },
  label: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 13,
    color: AppColors.subtitle,
    marginBottom: 6,
    marginTop: 8,
  },
  amountInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.LexendRegular,
    fontSize: 15,
    color: AppColors.black,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E5EA",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: FONTS.LexendMedium,
    color: AppColors.black,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveText: {
    fontFamily: FONTS.LexendSemiBold,
    color: AppColors.white,
  },
});
