import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../constants/color";
import { Images } from "../constants/images";
import i18n from "../Translation/i18n";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";

export default function LanguageChange() {
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [languages, setLanguages] = useState([]);

  const fetchLanguages = async () => {
    try {
      const res = await ApiService(apiConstants.langauge, {});
      if (res?.status && Array.isArray(res.data)) {
        setLanguages(res.data);
      }
    } catch (err) {
      console.log("Language API Error:", err);
    }
  };

  const loadSavedLanguage = async (langs) => {
    try {
      const saved = await AsyncStorage.getItem("userLanguage");

      if (saved && langs.length) {
        const found = langs.find(
          (l) => l.language_shortname === saved
        );
        if (found) {
          setSelected(found);
          i18n.changeLanguage(found.language_shortname);
          return;
        }
      }

      // fallback
      if (langs.length) {
        setSelected(langs[0]);
      }
    } catch (err) {
      console.log("Load Language Error:", err);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (languages.length) {
      loadSavedLanguage(languages);
    }
  }, [languages]);

  const changeLanguage = async (item) => {
    try {
      await AsyncStorage.setItem(
        "userLanguage",
        item.language_shortname
      );

      i18n.changeLanguage(item.language_shortname);

      setSelected(item);
      setModalVisible(false);
    } catch (err) {
      console.log("Change Language Error:", err);
    }
  };

  const renderItem = useCallback(
    ({ item }) => {
      const isSelected =
        selected?.language_shortname === item.language_shortname;

      return (
        <TouchableOpacity
          style={[styles.item, isSelected && styles.selectedItem]}
          onPress={() => changeLanguage(item)}
        >
          <Text
            style={[styles.itemText, isSelected && styles.selectedText]}
          >
            {item?.language_name || ""}
          </Text>
        </TouchableOpacity>
      );
    },
    [selected]
  );

  return (
    <View>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={styles.BtuttonContainer}
      >
        <Text style={styles.buttonText}>
          {selected?.language_name || "Select"}
        </Text>

        <Image
          source={Images.down}
          style={styles.icon}
          tintColor={Colors.white}
        />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalBox}>
            <FlatList
              data={languages}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              extraData={selected}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  BtuttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
  },
  icon: {
    width: 20,
    height: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "70%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
  },
  item: {
    padding: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#000",
  },
  selectedItem: {
    backgroundColor: "#eee",
  },
  selectedText: {
    fontWeight: "bold",
  },
});