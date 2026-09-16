import React, { useCallback, useContext, useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthButton from "../../Components/Auth/AuthButton";
import AuthInput from "../../Components/Auth/AuthInput";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  changePassword,
  fetchProfileSettings,
} from "../../services/profileSettingsService";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadSettings = useCallback(async () => {
    try {
      const settings = await fetchProfileSettings();
      setPasswordEnabled(settings.password_enabled);
    } catch {
      setPasswordEnabled(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};

    if (passwordEnabled && !currentPassword.trim()) {
      nextErrors.currentPassword = t("Enter current password");
    }
    if (!newPassword.trim()) {
      nextErrors.newPassword = t("Enter new password");
    }
    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = t("Confirm new password");
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      nextErrors.confirmPassword = t("New passwords do not match");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      setToast({
        top: 45,
        text: response.message || t("Password updated successfully"),
        type: "success",
        visible: true,
      });
      router.back();
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Change Password")} onBack={() => router.back()} />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        {passwordEnabled ? (
          <AuthInput
            label={t("Current password")}
            required
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              setErrors((prev) => ({ ...prev, currentPassword: "" }));
            }}
            secureTextEntry
            error={errors.currentPassword}
          />
        ) : null}
        <AuthInput
          label={t("New password")}
          required
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            setErrors((prev) => ({ ...prev, newPassword: "" }));
          }}
          secureTextEntry
          error={errors.newPassword}
        />
        <AuthInput
          label={t("Confirm new password")}
          required
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          secureTextEntry
          error={errors.confirmPassword}
        />
        <AuthButton title={t("Save")} onPress={handleSave} disabled={saving} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: 16,
  },
});
