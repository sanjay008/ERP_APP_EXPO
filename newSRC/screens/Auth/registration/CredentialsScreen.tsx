import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import AuthInput from "../../../Components/Auth/AuthInput";
import CountryPicker from "../../../Components/Auth/CountryPicker";
import SwitchMethodButton, { BackLink } from "../../../Components/Auth/SwitchMethodButton";
import { useAuthStore } from "../../../store/authStore";
import { mergeApiCountries } from "../../../utils/countryListHelper";
import { authTypography } from "../../../utils/authTypography";
import { isPhoneValid, isValidEmail } from "../../../utils/validation";

export default function CredentialsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    authMethod,
    phoneCountryCode,
    whatsappNumber,
    email,
    fieldErrors,
    isLoading,
    toastMessage,
    countries,
    setWhatsappNumber,
    setPhoneCountryCode,
    setEmail,
    setAuthMethod,
    setFlowMode,
    submitCredentials,
    clearToast,
    loadLanguagesAndCountries,
  } = useAuthStore();

  useEffect(() => {
    setFlowMode("login");
  }, [setFlowMode]);

  useEffect(() => {
    if (!countries.length) {
      loadLanguagesAndCountries();
    }
  }, [countries.length, loadLanguagesAndCountries]);

  useEffect(() => {
    if (authMethod !== "whatsapp") return;

    const code = phoneCountryCode.replace(/[^\d]/g, "");
    if (code === "31" && whatsappNumber.length === 0) {
      setWhatsappNumber("06");
      return;
    }
    if (code !== "31" && whatsappNumber === "06") {
      setWhatsappNumber("");
    }
  }, [authMethod, phoneCountryCode, whatsappNumber, setWhatsappNumber]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const mergedCountries = useMemo(() => mergeApiCountries(countries), [countries]);

  const isWhatsapp = authMethod === "whatsapp";
  const canSubmit = isWhatsapp
    ? isPhoneValid(phoneCountryCode, whatsappNumber)
    : isValidEmail(email);

  const switchMethod = () => {
    if (isWhatsapp) {
      setWhatsappNumber("");
      setAuthMethod("email");
    } else {
      setEmail("");
      setAuthMethod("whatsapp");
    }
  };

  const handleContinue = async () => {
    const next = await submitCredentials();
    if (next === "otp") {
      router.push("/registration/otp");
      return;
    }
    if (next === "password") {
      router.push("/registration/password");
      return;
    }
    if (next === "home") {
      router.replace("/(app)/(tabs)/menu");
    }
  };

  return (
    <AuthLayout
      title={t("Registration")}
      subtitle={t("Smart solutions for modern businesses")}
      loading={isLoading}
      toastMessage={toastMessage}
      headerLogo="company"
      backLink={
        <BackLink label={t("Change Company")} onPress={() => router.back()} />
      }
      footer={
        <>
          <AuthButton
            title={isWhatsapp ? t("Get OTP") : t("Continue")}
            onPress={handleContinue}
            disabled={!canSubmit}
          />
          <SwitchMethodButton
            label={isWhatsapp ? t("Switch to Email Address") : t("Switch to WhatsApp Number")}
            iconName={isWhatsapp ? "mail-outline" : "logo-whatsapp"}
            onPress={switchMethod}
          />
        </>
      }
    >
      {isWhatsapp ? (
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
            <Text style={[authTypography.error, styles.errorSpacing]}>
              {fieldErrors.whatsappNumber}
            </Text>
          ) : null}
        </View>
      ) : (
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
      )}
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
});
