import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import "intl-pluralrules";
import { initReactI18next } from "react-i18next";
import ApiService from "../utils/Apiservice";
import apiConstants from "../utils/apiConstants";
import { fallbackResources } from "./fallbacks";

type LanguageResource = {
  language_shortname: string;
  data: Record<string, string>;
};

const loadLanguage = async (): Promise<string> => {
  const storedLanguage = await AsyncStorage.getItem("userLanguage");
  return storedLanguage || "en";
};

const initI18n = async (lng: string) => {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(lng);
    return;
  }

  await i18n.use(initReactI18next).init({
    lng,
    fallbackLng: "en",
    resources: fallbackResources,
    interpolation: {
      escapeValue: false,
    },
  });
};

export const languagedata = async (): Promise<void> => {
  const lng = await loadLanguage();
  await initI18n(lng);

  try {
    const data = await ApiService<LanguageResource[]>(apiConstants.langauge, {});

    if (data.status && Array.isArray(data.data)) {
      const languageData = data.data.reduce<
        Record<string, { translation: Record<string, string> }>
      >((acc, language) => {
        acc[language.language_shortname] = { translation: language.data };
        return acc;
      }, {});

      Object.entries(languageData).forEach(([languageCode, resource]) => {
        const cleaned = Object.fromEntries(
          Object.entries(resource.translation).filter(
            ([, value]) => typeof value === "string" && value.trim().length > 0
          )
        );

        i18n.addResourceBundle(
          languageCode,
          "translation",
          cleaned,
          true,
          true
        );
      });

      await i18n.changeLanguage(lng);
    }
  } catch (err) {
    console.log("Error fetching language data:", err);
  }
};

languagedata();

export default i18n;
