import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import AuthInput from "../../../Components/Auth/AuthInput";
import { useAuthStore } from "../../../store/authStore";

export default function CompanyScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    companyName,
    fieldErrors,
    isLoading,
    toastMessage,
    setCompanyName,
    submitCompany,
    clearToast,
  } = useAuthStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const handleContinue = async () => {
    const success = await submitCompany();
    if (success) {
      router.push("/registration/credentials");
    }
  };

  return (
    <AuthLayout
      title={t("Registration")}
      subtitle={t("Smart solutions for modern businesses")}
      loading={isLoading}
      toastMessage={toastMessage}
      headerLogo="default"
      footer={<AuthButton title={t("Continue")} onPress={handleContinue} />}
    >
      <AuthInput
        label={t("Company Name")}
        required
        value={companyName}
        onChangeText={setCompanyName}
        placeholder={t("Enter company name")}
        iconName="business-outline"
        autoCapitalize="none"
        error={fieldErrors.companyName}
      />
    </AuthLayout>
  );
}
