import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../../Components/ScreenHeader";
import { fetchProfileSettings, type ProfileSettings } from "../../services/profileSettingsService";
import { getApiErrorMessage } from "../../utils/validation";
import { useScreenInsets } from "../../utils/screenInsets";
import { AppColors } from "../../utils/theme";
import { FONTS } from "../../utils/FONTS";
import { LIST_UI } from "../../utils/connectionTheme";
import { listScreenStyles } from "../../utils/listScreenStyles";

type SettingsItem = {
  key: string;
  title: string;
  subtitle?: string;
  href:
    | "/(app)/profile/change-password"
    | "/(app)/profile/change-language"
    | "/(app)/profile/change-timezone"
    | "/(app)/profile/password-settings";
  icon: keyof typeof Ionicons.glyphMap;
};

export default function ProfileSettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { top, scrollPadding } = useScreenInsets();
  const [settings, setSettings] = useState<ProfileSettings | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await fetchProfileSettings();
      setSettings(data);
    } catch (error) {
      console.log("get_profile_settings", getApiErrorMessage(error, t("Something went wrong")));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const languageCode = i18n.language || settings?.user_language;
  const languageLabel =
    settings?.available_languages.find((item) => item.code === languageCode)?.label ??
    languageCode;

  const items: SettingsItem[] = [
    {
      key: "password",
      title: t("Change Password"),
      href: "/(app)/profile/change-password",
      icon: "lock-closed-outline",
    },
    {
      key: "language",
      title: t("Change Language"),
      subtitle: languageLabel,
      href: "/(app)/profile/change-language",
      icon: "language-outline",
    },
    {
      key: "timezone",
      title: t("Change Timezone"),
      subtitle: settings?.timezone || undefined,
      href: "/(app)/profile/change-timezone",
      icon: "time-outline",
    },
    {
      key: "password-settings",
      title: t("Password Settings"),
      href: "/(app)/profile/password-settings",
      icon: "shield-checkmark-outline",
    },
  ];

  return (
    <View style={[listScreenStyles.container, { paddingTop: top }]}>
      <ScreenHeader title={t("Settings")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={listScreenStyles.rowCard}
            onPress={() => router.push(item.href)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={20} color={AppColors.primary} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={AppColors.subtitle} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: LIST_UI.screenPadding,
    paddingTop: LIST_UI.listTop,
  },
  iconWrap: {
    width: LIST_UI.idBoxSize,
    height: LIST_UI.idBoxSize,
    borderRadius: LIST_UI.iconRadius,
    backgroundColor: LIST_UI.idBoxBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
  },
  itemSubtitle: {
    marginTop: 4,
    fontFamily: FONTS.LexendRegular,
    fontSize: 13,
    color: AppColors.subtitle,
  },
});
