import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
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
      primary: primary.trim(),
      secondary: secondary.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.label}>{primaryLabel}</Text>
          <TextInput
            style={styles.input}
            value={primary}
            onChangeText={setPrimary}
            multiline={mode !== "complete-cash"}
            keyboardType={mode === "complete-cash" ? "decimal-pad" : "default"}
            placeholder={
              mode === "complete-cash"
                ? `${currencySymbol} 0.00`
                : t("Enter comment")
            }
          />

          {mode === "complete-cash" ? (
            <>
              <Text style={styles.label}>{t("Voeg een notitie toe")}</Text>
              <TextInput
                style={styles.input}
                value={secondary}
                onChangeText={setSecondary}
                multiline
                placeholder={t("Enter comment")}
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
        </View>
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
  input: {
    minHeight: 80,
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
