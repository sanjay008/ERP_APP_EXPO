import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { languagedata } from "../translation/i18n";
import { updateUserLanguage } from "../services/profileSettingsService";

export async function persistLocalLanguage(code: string) {
  await AsyncStorage.setItem("userLanguage", code);
  if (i18n.isInitialized) {
    await i18n.changeLanguage(code);
  }
  await languagedata();
}

export async function applyUserLanguage(code: string) {
  const response = await updateUserLanguage(code);
  await persistLocalLanguage(code);
  return response;
}

export async function getStoredLanguage() {
  return (await AsyncStorage.getItem("userLanguage")) || i18n.language || "en";
}
