import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import {
  fetchProfileSettings,
  updatePasswordSettings,
} from "../../services/profileSettingsService";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

export default function PasswordSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { top } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [otpEnabled, setOtpEnabled] = useState(true);
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await fetchProfileSettings();
      setOtpEnabled(settings.otp_enabled);
      setPasswordEnabled(settings.password_enabled);
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  }, [setToast, t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const persistSettings = async (nextOtp: boolean, nextPassword: boolean) => {
    if (!nextOtp && !nextPassword) {
      setToast({
        top: 45,
        text: t("OTP and Password cannot both be off"),
        type: "error",
        visible: true,
      });
      return false;
    }

    setSaving(true);
    try {
      const response = await updatePasswordSettings({
        otpEnabled: nextOtp,
        passwordEnabled: nextPassword,
      });
      setOtpEnabled(nextOtp);
      setPasswordEnabled(nextPassword);
      if (response.message) {
        setToast({
          top: 45,
          text: response.message,
          type: "success",
          visible: true,
        });
      }
      return true;
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("OTP and Password cannot both be off")),
        type: "error",
        visible: true,
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onToggleOtp = async (value: boolean) => {
    const previous = otpEnabled;
    setOtpEnabled(value);
    const ok = await persistSettings(value, passwordEnabled);
    if (!ok) setOtpEnabled(previous);
  };

  const onTogglePassword = async (value: boolean) => {
    const previous = passwordEnabled;
    setPasswordEnabled(value);
    const ok = await persistSettings(otpEnabled, value);
    if (!ok) setPasswordEnabled(previous);
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Password Settings")} onBack={() => router.back()} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={listScreenStyles.rowCard}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t("OTP Verification")}</Text>
            </View>
            <Switch
              value={otpEnabled}
              onValueChange={onToggleOtp}
              disabled={saving}
              trackColor={{ false: "#D1D5DB", true: AppColors.primary }}
              thumbColor={AppColors.white}
            />
          </View>
          <View style={listScreenStyles.rowCard}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t("Password Enabled")}</Text>
            </View>
            <Switch
              value={passwordEnabled}
              onValueChange={onTogglePassword}
              disabled={saving}
              trackColor={{ false: "#D1D5DB", true: AppColors.primary }}
              thumbColor={AppColors.white}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: LIST_UI.listTop,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
  },
});
