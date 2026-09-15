import { useEffect, useMemo, useState } from "react";
import { Linking, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AuthLayout from "../../../Components/Auth/AuthLayout";
import AuthButton from "../../../Components/Auth/AuthButton";
import AuthSelect from "../../../Components/Auth/AuthSelect";
import SelectionSheet from "../../../Components/Auth/SelectionSheet";
import { useAuthStore } from "../../../store/authStore";

export default function LanguageCountryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);

  const {
    languages,
    countries,
    selectedLanguage,
    selectedCountryCode,
    fieldErrors,
    isLoading,
    toastMessage,
    loadLanguagesAndCountries,
    selectLanguage,
    selectCountryCode,
    saveLanguageCountry,
    clearToast,
  } = useAuthStore();

  useEffect(() => {
    loadLanguagesAndCountries();
  }, [loadLanguagesAndCountries]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const languageOptions = useMemo(
    () =>
      languages.map((item) => ({
        label: item.language_name,
        value: item.language_shortname,
      })),
    [languages]
  );

  const countryOptions = useMemo(
    () =>
      countries.map((item) => ({
        label: `${item.country_code} ${item.country_name}`,
        value: item.country_code,
      })),
    [countries]
  );

  const handleContinue = async () => {
    const saved = await saveLanguageCountry();
    if (saved) {
      router.replace("/registration/company");
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
      <AuthSelect
        label={t("Language")}
        value={selectedLanguage?.language_name}
        placeholder={t("Select Language")}
        error={fieldErrors.language}
        onPress={() => setLanguageSheetOpen(true)}
      />

      <AuthSelect
        label={t("Country Code")}
        value={
          countryOptions.find((item) => item.value === selectedCountryCode)?.label
        }
        placeholder={t("Select country code")}
        error={fieldErrors.countryCode}
        onPress={() => setCountrySheetOpen(true)}
      />

      <SelectionSheet
        visible={languageSheetOpen}
        title={t("Select Language")}
        options={languageOptions}
        onClose={() => setLanguageSheetOpen(false)}
        onSelect={(option) => {
          const language = languages.find(
            (item) => item.language_shortname === option.value
          );
          if (language) selectLanguage(language);
        }}
      />

      <SelectionSheet
        visible={countrySheetOpen}
        title={t("Select country code")}
        options={countryOptions}
        onClose={() => setCountrySheetOpen(false)}
        onSelect={(option) => selectCountryCode(option.value)}
      />
    </AuthLayout>
  );
}
