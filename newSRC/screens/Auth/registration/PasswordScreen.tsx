import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import AuthInput from "../../../Components/Auth/AuthInput";
import SwitchMethodButton, { BackLink } from "../../../Components/Auth/SwitchMethodButton";
import { useAuthStore } from "../../../store/authStore";

export default function PasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    password,
    fieldErrors,
    isLoading,
    toastMessage,
    setPassword,
    setAuthMethod,
    submitPassword,
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

  const handleVerify = async () => {
    const next = await submitPassword();
    if (next === "home") {
      router.replace("/(app)/(tabs)/menu");
    }
    if (next === "profile") {
      router.replace("/registration/profile");
    }
  };

  return (
    <AuthLayout
      title={t("Registration")}
      subtitle={t("Smart solutions for modern businesses")}
      loading={isLoading}
      toastMessage={toastMessage}
      headerLogo="company"
      backLink={<BackLink label={t("Change Email")} onPress={() => router.back()} />}
      footer={
        <>
          <AuthButton title={t("Verify & Proceed")} onPress={handleVerify} />
          <SwitchMethodButton
            label={t("Switch to WhatsApp Number")}
            iconName="logo-whatsapp"
            onPress={() => {
              setAuthMethod("whatsapp");
              router.replace("/registration/credentials");
            }}
          />
        </>
      }
    >
      <AuthInput
        label={t("Password")}
        required
        value={password}
        onChangeText={setPassword}
        placeholder={t("Enter password")}
        iconName="lock-closed-outline"
        secureTextEntry={!showPassword}
        error={fieldErrors.password}
        rightIcon={
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#6B7280"
          />
        }
        onRightIconPress={() => setShowPassword((prev) => !prev)}
      />
    </AuthLayout>
  );
}
