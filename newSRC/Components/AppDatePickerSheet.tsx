import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";

type Props = {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export default function AppDatePickerSheet({
  visible,
  value,
  onConfirm,
  onClose,
  minimumDate,
  maximumDate,
}: Props) {
  const { t } = useTranslation();
  const [draftDate, setDraftDate] = useState(value);

  useEffect(() => {
    if (visible) setDraftDate(value);
  }, [visible, value]);

  if (!visible) return null;

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={draftDate}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          onClose();
          if (event.type === "dismissed" || !date) return;
          onConfirm(date);
        }}
      />
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.cancelText}>{t("Cancel")}</Text>
            </Pressable>
            <Text style={styles.sheetTitle}>{t("Select date")}</Text>
            <Pressable
              onPress={() => {
                onConfirm(draftDate);
                onClose();
              }}
              hitSlop={8}
            >
              <Text style={styles.doneText}>{t("Done")}</Text>
            </Pressable>
          </View>

          <DateTimePicker
            value={draftDate}
            mode="date"
            display="inline"
            themeVariant="light"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_event: DateTimePickerEvent, date?: Date) => {
              if (date) setDraftDate(date);
            }}
            style={styles.picker}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 16,
    color: AppColors.black,
  },
  cancelText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.subtitle,
  },
  doneText: {
    fontFamily: FONTS.LexendSemiBold,
    fontSize: 15,
    color: AppColors.primary,
  },
  picker: {
    alignSelf: "center",
    width: "100%",
  },
});
