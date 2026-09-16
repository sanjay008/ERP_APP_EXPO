import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AuthButton from "../../Components/Auth/AuthButton";
import ScreenHeader from "../../Components/ScreenHeader";
import { RegisterBackContext } from "../../constants/GoBackContext";
import { fetchLanguages } from "../../services/authService";
import { fetchProfileSettings } from "../../services/profileSettingsService";
import { applyUserLanguage, getStoredLanguage } from "../../utils/languageSync";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type LanguageOption = {
  code: string;
  label: string;
};

export default function ChangeLanguageScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const { setToast } = useContext(RegisterBackContext);

  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selected, setSelected] = useState(i18n.language || "en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [langRes, stored, settings] = await Promise.all([
        fetchLanguages(),
        getStoredLanguage(),
        fetchProfileSettings().catch(() => null),
      ]);

      const fromApi =
        langRes.status && Array.isArray(langRes.data)
          ? langRes.data.map((item) => ({
              code: item.language_shortname,
              label: item.language_name,
            }))
          : [];

      setLanguages(fromApi.length ? fromApi : settings?.available_languages ?? []);
      setSelected(stored || settings?.user_language || i18n.language || "en");
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
  }, [i18n.language, setToast, t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await applyUserLanguage(selected);
      setToast({
        top: 45,
        text: response.message || t("Language updated successfully"),
        type: "success",
        visible: true,
      });
      router.back();
    } catch (error) {
      setToast({
        top: 45,
        text: getApiErrorMessage(error, t("Something went wrong")),
        type: "error",
        visible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Change Language")} onBack={() => router.back()} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {languages.map((item) => {
            const active = item.code === selected;
            return (
              <Pressable
                key={item.code}
                style={listScreenStyles.rowCard}
                onPress={() => setSelected(item.code)}
              >
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{item.label}</Text>
                </View>
                <Ionicons
                  name={active ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={active ? AppColors.primary : AppColors.subtitle}
                />
              </Pressable>
            );
          })}
          <AuthButton title={t("Save")} onPress={handleSave} disabled={saving} />
        </ScrollView>
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
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
  },
});
