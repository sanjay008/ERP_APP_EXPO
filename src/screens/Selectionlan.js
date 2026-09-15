import {
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Images } from "../constants/images";
import { Colors } from "../constants/color";
import { RFValue } from "react-native-responsive-fontsize";
import { FONTS } from "../constants/fontFamily";
import i18n from "../Translation/i18n";
import ButtonComponent from "../components/buttonComponent";
import { storeData } from "../utils/storeData";
import apiConstants from "../api/apiConstants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../utils/Apiservice";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_LANGUAGE = {
  language_name: "Nederlands",
  language_shortname: "nl",
};

const waitForI18nReady = () =>
  new Promise((resolve) => {
    if (i18n.isInitialized) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (i18n.isInitialized || attempts >= 30) {
        clearInterval(timer);
        resolve(i18n.isInitialized);
      }
    }, 100);
  });

const getCountryCodeByPrefix = (list, prefix) => {
  if (!Array.isArray(list)) {
    return null;
  }
  const match = list.find((item) => item?.country_code?.includes(prefix));
  return match?.country_code ?? null;
};

const Select = () => {
  const navigation = useNavigation();
  const Focused = useIsFocused();
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  const [currentCountryCode, setCurrentCountryCode] = useState(null);
  const [isLanguageValid, setIsLanguageValid] = useState(true);
  const [isCountryCodeValid, setIsCountryCodeValid] = useState(true);
  const [langauge, setlangauge] = useState([]);
  const [country, setCountry] = useState([]);
  const [Loader, setLoader] = useState(false);
  const [secondLoader, setSecondLoader] = useState(false);
  const [activeLocale, setActiveLocale] = useState(DEFAULT_LANGUAGE.language_shortname);
  const hasUserSelectedLanguageRef = useRef(false);

  const translateKey = useCallback(
    (key, fallback = key) => {
      try {
        if (i18n.isInitialized) {
          const value = i18n.t(key, { lng: activeLocale });
          return value && value !== key ? value : fallback;
        }
        return fallback;
      } catch (error) {
        return fallback;
      }
    },
    [activeLocale]
  );

  const changeLanguage = useCallback(async (languageItem) => {
    if (!languageItem?.language_shortname) {
      return;
    }

    const shortName = languageItem.language_shortname;
    setCurrentLanguage(languageItem);
    setActiveLocale(shortName);

    try {
      await AsyncStorage.setItem("userLanguage", shortName);
      await waitForI18nReady();

      if (i18n.isInitialized) {
        await i18n.changeLanguage(shortName);
        setActiveLocale(i18n.language || shortName);
      }
    } catch (error) {
      console.log("changeLanguage error:", error);
    }
  }, []);

  const languagedata = useCallback(async () => {
    setSecondLoader(true);

    try {
      const data = await ApiService(apiConstants.langauge, {});
      const list =
        data?.status && Array.isArray(data?.data) ? data.data : [];
      setlangauge(list);
      return list;
    } catch (err) {
      console.log("Error fetching language data:", err);
      setlangauge([]);
      return [];
    } finally {
      setSecondLoader(false);
    }
  }, []);

  const loadCountryData = useCallback(async (languageItem) => {
    setLoader(true);

    try {
      const data = await ApiService(apiConstants.country, {});
      const countryList = Array.isArray(data?.data) ? data.data : [];

      if (data?.status) {
        setCountry(countryList);

        if (languageItem?.language_shortname === "nl") {
          setCurrentCountryCode(getCountryCodeByPrefix(countryList, "+31"));
        } else if (languageItem?.language_shortname === "en") {
          setCurrentCountryCode(getCountryCodeByPrefix(countryList, "+91"));
        }
      } else {
        setCountry([]);
      }

      return countryList;
    } catch (err) {
      console.log("Error fetching country data:", err);
      setCountry([]);
      return [];
    } finally {
      setLoader(false);
    }
  }, []);

  useEffect(() => {
    if (!Focused) {
      return;
    }

    let isActive = true;

    const initializeScreen = async () => {
      try {
        const languages =
          Array.isArray(langauge) && langauge.length > 0
            ? langauge
            : await languagedata();

        if (!isActive || hasUserSelectedLanguageRef.current) {
          return;
        }

        const savedShortName = await AsyncStorage.getItem("userLanguage");
        const resolvedLanguage =
          languages.find((item) => item?.language_shortname === savedShortName) ||
          languages.find((item) => item?.language_shortname === DEFAULT_LANGUAGE.language_shortname) ||
          languages[0] ||
          DEFAULT_LANGUAGE;

        if (hasUserSelectedLanguageRef.current) {
          return;
        }

        setCurrentLanguage(resolvedLanguage);
        setActiveLocale(resolvedLanguage.language_shortname);

        if (!Array.isArray(country) || country.length === 0) {
          await loadCountryData(resolvedLanguage);
        }

        if (!isActive || hasUserSelectedLanguageRef.current) {
          return;
        }

        await AsyncStorage.setItem(
          "userLanguage",
          resolvedLanguage.language_shortname
        );

        await waitForI18nReady();

        if (i18n.isInitialized) {
          await i18n.changeLanguage(resolvedLanguage.language_shortname);
          setActiveLocale(i18n.language || resolvedLanguage.language_shortname);
        }
      } catch (error) {
        console.log("Select screen init error:", error);
      }
    };

    initializeScreen();

    return () => {
      isActive = false;
    };
  }, [Focused]);

  const handleLanguageSelect = async (item) => {
    if (!item?.language_shortname) {
      return;
    }

    hasUserSelectedLanguageRef.current = true;

    if (item.language_shortname === "nl") {
      setCurrentCountryCode(getCountryCodeByPrefix(country, "+31"));
    } else if (item.language_shortname === "en") {
      setCurrentCountryCode(getCountryCodeByPrefix(country, "+91"));
    }

    await changeLanguage(item);
    setIsLanguageValid(true);
  };

  const handleCountryCodeSelect = (item) => {
    if (!item?.country_code) {
      return;
    }

    setCurrentCountryCode(item.country_code);
    setIsCountryCodeValid(true);
  };

  const handleEnter = async () => {
    if (!currentLanguage?.language_shortname || !currentCountryCode) {
      setIsLanguageValid(!!currentLanguage?.language_shortname);
      setIsCountryCodeValid(!!currentCountryCode);

      Alert.alert(
        translateKey("Validation Error"),
        translateKey("Please select both language and country code")
      );
      return;
    }

    try {
      await storeData("SELECT", true);
      await storeData("country_code", currentCountryCode);
      navigation.navigate("CompanyLogin");
    } catch (error) {
      console.log("handleEnter error:", error);
    }
  };

  const languageList = Array.isArray(langauge) ? langauge : [];
  const countryList = Array.isArray(country) ? country : [];
  const showSubmitButton =
    !Loader && !secondLoader && languageList.length > 0 && countryList.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.logoContainer}>
          <Image source={Images.roundlogo} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>
          {translateKey("SelectLanguage")}
          <Text style={styles.required}>*</Text>
        </Text>

        {secondLoader ? (
          <ActivityIndicator color={Colors.primary} size="small" style={styles.loader} />
        ) : (
          <View style={styles.listContainer}>
            {languageList?.map((item, index) => {
              if (!item) {
                return null;
              }

              return (
                <Pressable
                  key={String(item?.id ?? item?.language_shortname ?? index)}
                  onPress={() => handleLanguageSelect(item)}
                  style={[
                    styles.dropdownItemStyle,
                    item?.language_shortname === currentLanguage?.language_shortname &&
                      styles.selectedItem,
                  ]}
                >
                  <Text style={styles.dropdownItemTxtStyle}>
                    {item?.language_name || ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.title}>
          {translateKey("SelectCountryCode")}
          <Text style={styles.required}>*</Text>
        </Text>

        {Loader ? (
          <ActivityIndicator color={Colors.primary} size="small" style={styles.loader} />
        ) : (
          <View style={styles.listContainer}>
            {countryList.map((item, index) => {
              if (!item) {
                return null;
              }

              return (
                <Pressable
                  key={String(item?.id ?? item?.country_code ?? index)}
                  onPress={() => handleCountryCodeSelect(item)}
                  style={[
                    styles.dropdownItemStyle,
                    item?.country_code === currentCountryCode && styles.selectedItem,
                  ]}
                >
                  <Text style={styles.dropdownItemTxtStyle}>
                    {item?.country_code || ""}
                  </Text>
                  <Text style={styles.dropdownItemTxtStyle}>
                    {item?.country_name || ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {showSubmitButton && (
          <View style={styles.submitButtonContainer}>
            <ButtonComponent
              onPress={handleEnter}
              marginTop={RFValue(8)}
              width="100%"
              title={translateKey("Enter")}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Select;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: RFValue(16),
  },
  logoContainer: {
    alignItems: "center",
    marginTop: RFValue(8),
    marginBottom: RFValue(8),
  },
  logo: {
    height: RFValue(120),
    width: RFValue(120),
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FONTS.LexendMedium,
    color: Colors.black,
    marginBottom: RFValue(6),
    marginTop: RFValue(10),
  },
  listContainer: {
    gap: RFValue(8),
  },
  loader: {
    marginVertical: RFValue(8),
  },
  dropdownItemStyle: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: RFValue(10),
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.Boxgray,
  },
  selectedItem: {
    borderColor: Colors.primary,
  },
  dropdownItemTxtStyle: {
    fontSize: RFValue(13),
    fontFamily: FONTS.LexendRegular,
    color: Colors.black,
    marginRight: 8,
  },
  submitButtonContainer: {
    marginTop: RFValue(16),
    marginBottom: RFValue(8),
  },
  required: {
    color: Colors.red,
  },
});
