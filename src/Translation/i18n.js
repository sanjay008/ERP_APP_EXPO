import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../utils/Apiservice";
import apiConstants from "../api/apiConstants";
// import { ApiService, apiConstants } from './ApiService'; // Import ApiService

const loadLanguage = async () => {
  const storedLanguage = await AsyncStorage.getItem("userLanguage");
  return storedLanguage || "en"; // Default to 'nl' if none is found
};

export const languagedata = async () => {
  try {
    const data = await ApiService(apiConstants.langauge, {});
    if (data.status) {
      // Assuming `data.data` has the language details
      const languageData = data.data.reduce((acc, language) => {
        acc[language.language_shortname] = { translation: language.data };
        return acc;
      }, {}); // this is key and value like a resources

      // Set the resources dynamically
      i18n.use(initReactI18next).init({
        lng: await loadLanguage(), // Use the loaded language (stored or default)
        fallbackLng: "en", // Set a fallback language
        resources: languageData, // Dynamically populated resources
        interpolation: {
          escapeValue: false, // React already escapes
        },
      });

      // console.log("Language Data set:", languageData); // Check resources
    } else {
      console.log("API response is not valid");
    }
  } catch (err) {
    console.log("Error fetching language data:", err);
  }
};

languagedata(); // Call the function to load the language dynamically

export default i18n;

// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import English from "../Translation/English.json";
// import Dutch from "../Translation/Dutch.json";

// const loadLanguage = async () => {
//   const storedLanguage = await AsyncStorage.getItem('userLanguage');
//   return storedLanguage || 'nl'; // Default to 'nl' if none is found
// };
// export const languagedata = async () => {
//   try {
//     const data = await ApiService(apiConstants.langauge, {});
//     if (data.status) {
//       // setlangauge(data.data);
//       const languageData = data.data.map(language => language.data);
//       setlangauge(languageData);
//       console.log("Language Data:0000000000", languageData);
//     } else {
//       console.log("False");
//     }
//   } catch (err) {
//     console.log("Error fetching connections:", err);
//   }
// };

// loadLanguage().then((lang) => {
//   i18n.use(initReactI18next).init({
//     lng: lang, // Use the loaded language
//     fallbackLng: "en",
//     resources: {
//       en: { translation: English },
//       nl: { translation: Dutch },
//     },
//     interpolation: {
//       escapeValue: false,
//     },
//   });
// });

// export default i18n;
