import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import OtpInput from "../../../Components/Auth/OtpInput";
import { BackLink, AuthSecondaryButton } from "../../../Components/Auth/SwitchMethodButton";
import { useAuthStore } from "../../../store/authStore";
import { authTypography } from "../../../utils/authTypography";
import { AppColors } from "../../../utils/theme";

const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const {
    authMethod,
    flowMode,
    otpContactLabel,
    fieldErrors,
    isLoading,
    toastMessage,
    submitOtp,
    submitSignupOtp,
    resendOtpCode,
    clearFieldError,
    clearToast,
  } = useAuthStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleVerify = async () => {
    const next =
      flowMode === "signup" ? await submitSignupOtp(otp) : await submitOtp(otp);

    if (next === "home") {
      router.replace("/(app)/(tabs)/menu");
    }
    if (next === "profile") {
      router.replace("/registration/profile");
    }
    if (next === "signup-profile") {
      router.replace("/registration/signup-profile");
    }
  };

  const handleResend = async () => {
    const success = await resendOtpCode();
    if (success) {
      setSecondsLeft(RESEND_SECONDS);
      setOtp("");
      clearFieldError("otp");
    }
  };

  const openWhatsApp = async () => {
    const url =
      Platform.OS === "android"
        ? "https://wa.me/31631031703"
        : "whatsapp://send?phone=31631031703";
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const title =
    authMethod === "email" ? t("Verify Email Address") : t("Verify WhatsApp Number");

  return (
    <AuthLayout
      title={title}
      subtitle={t("We've sent a verification code to your {{contact}}", {
        contact: otpContactLabel,
      })}
      loading={isLoading}
      toastMessage={toastMessage}
      headerLogo="company"
      backLink={
        <BackLink
          label={authMethod === "email" ? t("Change Email") : t("Change WhatsApp Number")}
          onPress={() => router.back()}
        />
      }
      footer={
        <>
          <Pressable
            onPress={secondsLeft === 0 ? handleResend : undefined}
            style={styles.resendRow}
          >
            <Text style={authTypography.resend}>
              {secondsLeft > 0
                ? `00:${String(secondsLeft).padStart(2, "0")}`
                : "00:00"}{" "}
              {t("Resend")}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={AppColors.subtitle} />
          </Pressable>
          <AuthButton title={t("Verify & Proceed")} onPress={handleVerify} />
          {authMethod === "whatsapp" ? (
            <AuthSecondaryButton
              label={t("Open WhatsApp")}
              iconName="logo-whatsapp"
              onPress={openWhatsApp}
            />
          ) : null}
        </>
      }
    >
      <OtpInput
        value={otp}
        onChange={(value) => {
          setOtp(value);
          clearFieldError("otp");
        }}
        error={fieldErrors.otp}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  resendRow: {
    marginBottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
