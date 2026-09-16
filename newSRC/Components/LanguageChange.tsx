import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { fetchLanguages, type LanguageItem } from "../services/authService";
import { applyUserLanguage } from "../utils/languageSync";
import { getApiErrorMessage } from "../utils/validation";
import { RegisterBackContext } from "../constants/GoBackContext";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import i18n from "../translation/i18n";

export default function LanguageChange() {
  const { t } = useTranslation();
  const { setToast } = useContext(RegisterBackContext);
  const [selected, setSelected] = useState<LanguageItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [saving, setSaving] = useState(false);

  const selectByCode = useCallback((code: string, langs: LanguageItem[]) => {
    const found = langs.find((item) => item.language_shortname === code);
    if (found) setSelected(found);
  }, []);

  const loadLanguages = useCallback(async () => {
    try {
      const res = await fetchLanguages();
      if (res?.status && Array.isArray(res.data)) {
        setLanguages(res.data);
        selectByCode(i18n.language || "en", res.data);
      }
    } catch (err) {
      console.log("Language API Error:", err);
    }
  }, [selectByCode]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  useEffect(() => {
    const onChanged = (lng: string) => selectByCode(lng, languages);
    i18n.on("languageChanged", onChanged);
    return () => {
      i18n.off("languageChanged", onChanged);
    };
  }, [languages, selectByCode]);

  const changeLanguage = async (item: LanguageItem) => {
    if (saving || item.language_shortname === selected?.language_shortname) {
      setModalVisible(false);
      return;
    }

    setSaving(true);
    try {
      await applyUserLanguage(item.language_shortname);
      setSelected(item);
      setModalVisible(false);
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
    <>
      <Pressable style={styles.trigger} onPress={() => setModalVisible(true)}>
        <Text style={styles.triggerText}>{selected?.language_name ?? t("English")}</Text>
        <Ionicons name="chevron-down" size={16} color={AppColors.black} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => !saving && setModalVisible(false)}>
          <View style={styles.sheet}>
            {saving ? (
              <View style={styles.savingWrap}>
                <ActivityIndicator color={AppColors.primary} />
              </View>
            ) : (
              <FlatList
                data={languages}
                keyExtractor={(item) => item.language_shortname}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      selected?.language_shortname === item.language_shortname &&
                        styles.optionActive,
                    ]}
                    onPress={() => changeLanguage(item)}
                  >
                    <Text style={styles.optionText}>{item.language_name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    backgroundColor: AppColors.white,
  },
  triggerText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 14,
    color: AppColors.black,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    maxHeight: 280,
    overflow: "hidden",
  },
  savingWrap: {
    paddingVertical: 28,
    alignItems: "center",
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  optionActive: {
    backgroundColor: "#EEF4FD",
  },
  optionText: {
    fontFamily: FONTS.LexendMedium,
    fontSize: 15,
    color: AppColors.black,
  },
});
