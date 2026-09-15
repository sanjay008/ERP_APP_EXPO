import { useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppColors } from "../../utils/theme";
import { authTypography } from "../../utils/authTypography";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function OtpInput({
  length = 6,
  value,
  onChange,
  error,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const boxes = Array.from({ length }, (_, index) => value[index] ?? "");

  const handleChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, "").slice(0, length);
    onChange(sanitized);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
        {boxes.map((char, index) => {
          const isActive = index === value.length;
          return (
            <View
              key={index}
              style={[
                styles.box,
                isActive && styles.boxActive,
                error ? styles.boxError : null,
              ]}
            >
              <Text style={authTypography.otpChar}>{char}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={styles.hiddenInput}
        autoFocus
        caretHidden
      />

      {error ? <Text style={authTypography.errorCenter}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    marginBottom: 24,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    borderWidth: 2,
    borderColor: "#D8DEE6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.white,
  },
  boxActive: {
    borderColor: AppColors.primary,
  },
  boxError: {
    borderColor: "#EF4444",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0.01,
    width: "100%",
    height: 56,
  },
});
