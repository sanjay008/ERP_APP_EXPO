import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import AuthInput from "../../../Components/Auth/AuthInput";
import CountryPicker from "../../../Components/Auth/CountryPicker";
import { BackLink } from "../../../Components/Auth/SwitchMethodButton";
import { useAuthStore } from "../../../store/authStore";
import { mergeApiCountries } from "../../../utils/countryListHelper";
import { authTypography } from "../../../utils/authTypography";
import { isPhoneValid } from "../../../utils/validation";

export default function SignupWhatsappScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    companyName,
    phoneCountryCode,
    whatsappNumber,
    fieldErrors,
    isLoading,
    toastMessage,
    countries,
    setWhatsappNumber,
    setPhoneCountryCode,
    setFlowMode,
    submitSignupWhatsapp,
    clearToast,
    loadLanguagesAndCountries,
  } = useAuthStore();

  useEffect(() => {
    if (!companyName.trim()) {
      router.replace("/registration/company");
    }
  }, [companyName, router]);

  useEffect(() => {
    setFlowMode("signup");
    if (!countries.length) {
      loadLanguagesAndCountries();
    }
  }, [countries.length, loadLanguagesAndCountries, setFlowMode]);

  useEffect(() => {
    const code = phoneCountryCode.replace(/[^\d]/g, "");
    if (code === "31" && whatsappNumber.length === 0) {
      setWhatsappNumber("06");
    }
  }, [phoneCountryCode, setWhatsappNumber, whatsappNumber.length]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const mergedCountries = useMemo(() => mergeApiCountries(countries), [countries]);
  const canSubmit = isPhoneValid(phoneCountryCode, whatsappNumber);

  const handleContinue = async () => {
    const success = await submitSignupWhatsapp();
    if (success) {
      router.push("/registration/otp");
    }
  };

  return (
    <AuthLayout
      title={t("Create Account")}
      subtitle={t("Register with your WhatsApp number")}
      loading={isLoading}
      toastMessage={toastMessage}
      backLink={
        <BackLink label={t("Change Company")} onPress={() => router.back()} />
      }
      footer={
        <>
          <AuthButton
            title={t("Verify & Proceed")}
            onPress={handleContinue}
            disabled={!canSubmit}
          />
          <Pressable onPress={() => router.replace("/registration/credentials")} style={styles.linkWrap}>
            <Text style={authTypography.link}>{t("Already have an account? Log in")}</Text>
          </Pressable>
        </>
      }
    >
      <View style={styles.field}>
        <Text style={authTypography.label}>
          {t("WhatsApp Number")}
          <Text style={authTypography.required}> *</Text>
        </Text>
        <CountryPicker
          value={whatsappNumber}
          setValue={setWhatsappNumber}
          countryCode={phoneCountryCode}
          countries={mergedCountries}
          placeholder={t("Enter whatsapp number")}
          onSelect={(country) => setPhoneCountryCode(country.countrycode)}
        />
        {fieldErrors.whatsappNumber ? (
          <Text style={[authTypography.error, styles.errorSpacing]}>{fieldErrors.whatsappNumber}</Text>
        ) : null}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 18,
  },
  errorSpacing: {
    marginTop: 6,
  },
  linkWrap: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 4,
  },
});
