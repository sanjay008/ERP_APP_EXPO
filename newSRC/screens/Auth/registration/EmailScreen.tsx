import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import AuthInput from "../../../Components/Auth/AuthInput";
import SwitchMethodButton, { BackLink } from "../../../Components/Auth/SwitchMethodButton";
import { useAuthStore } from "../../../store/authStore";
import { isValidEmail } from "../../../utils/validation";

export default function EmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    email,
    fieldErrors,
    isLoading,
    toastMessage,
    setEmail,
    setAuthMethod,
    submitCredentials,
    clearToast,
  } = useAuthStore();

  useEffect(() => {
    setAuthMethod("email");
  }, [setAuthMethod]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const canSubmit = isValidEmail(email);

  const handleContinue = async () => {
    const next = await submitCredentials();
    if (next === "otp") router.push("/registration/otp");
    if (next === "password") router.push("/registration/password");
    if (next === "home") router.replace("/(app)/(tabs)/menu");
  };

  return (
    <AuthLayout
      title={t("Registration")}
      subtitle={t("Smart solutions for modern businesses")}
      loading={isLoading}
      toastMessage={toastMessage}
      backLink={
        <BackLink label={t("Change Company")} onPress={() => router.back()} />
      }
      footer={
        <>
          <AuthButton
            title={t("Continue")}
            onPress={handleContinue}
            disabled={!canSubmit}
          />
          <SwitchMethodButton
            label={t("Switch to WhatsApp Number")}
            onPress={() => router.push("/registration/whatsapp")}
          />
        </>
      }
    >
      <AuthInput
        label={t("Email Address")}
        required
        value={email}
        onChangeText={setEmail}
        placeholder={t("Enter email address")}
        iconName="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        error={fieldErrors.email}
      />
    </AuthLayout>
  );
}
