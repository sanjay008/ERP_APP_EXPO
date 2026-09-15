import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import AuthButton from "./AuthButton";
import { AppColors } from "../../utils/theme";

type Props = {
  visible: boolean;
  value: Date;
  confirmText: string;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  onClose: () => void;
};

export default function AuthBirthDatePicker({
  visible,
  value,
  confirmText,
  onChange,
  onClose,
}: Props) {
  if (!visible) return null;

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        maximumDate={new Date()}
        minimumDate={new Date(1920, 0, 1)}
        onChange={onChange}
      />
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <DateTimePicker
            value={value}
            mode="date"
            display="spinner"
            themeVariant="light"
            maximumDate={new Date()}
            minimumDate={new Date(1920, 0, 1)}
            onChange={onChange}
            style={styles.picker}
          />
          <AuthButton title={confirmText} onPress={onClose} />
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  picker: {
    width: "100%",
    height: 216,
    alignSelf: "center",
  },
});
