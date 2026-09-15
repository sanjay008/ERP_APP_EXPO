import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import ApiService from "../utils/Apiservice";
import { apiConstants } from "../utils/apiConstants";
import { AppColors } from "../utils/theme";
import { FONTS } from "../utils/FONTS";
import i18n from "../translation/i18n";

type LanguageItem = {
  language_name: string;
  language_shortname: string;
};

export default function LanguageChange() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<LanguageItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);

  const fetchLanguages = useCallback(async () => {
    try {
      const res = await ApiService<LanguageItem[]>(apiConstants.langauge, {});
      if (res?.status && Array.isArray(res.data)) {
        setLanguages(res.data);
      }
    } catch (err) {
      console.log("Language API Error:", err);
    }
  }, []);

  const loadSavedLanguage = useCallback(async (langs: LanguageItem[]) => {
    try {
      const saved = await AsyncStorage.getItem("userLanguage");

      if (saved && langs.length) {
        const found = langs.find((l) => l.language_shortname === saved);
        if (found) {
          setSelected(found);
          await i18n.changeLanguage(found.language_shortname);
          return;
        }
      }

      if (langs.length) {
        setSelected(langs[0]);
      }
    } catch (err) {
      console.log("Load Language Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    if (languages.length) {
      loadSavedLanguage(languages);
    }
  }, [languages, loadSavedLanguage]);

  const changeLanguage = async (item: LanguageItem) => {
    try {
      await AsyncStorage.setItem("userLanguage", item.language_shortname);
      await i18n.changeLanguage(item.language_shortname);
      setSelected(item);
      setModalVisible(false);
    } catch (err) {
      console.log("Change Language Error:", err);
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
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.language_shortname}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selected?.language_shortname === item.language_shortname && styles.optionActive,
                  ]}
                  onPress={() => changeLanguage(item)}
                >
                  <Text style={styles.optionText}>{item.language_name}</Text>
                </TouchableOpacity>
              )}
            />
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
