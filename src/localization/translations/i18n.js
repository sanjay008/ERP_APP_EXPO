// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json'; // Example English translations
import dutch from './dutch.json'; // Example Dutch translations

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      dutch: { translation: dutch }
    },
    interpolation: {
      escapeValue: false // React is already safe from XSS
    }
  });

export default i18n;
