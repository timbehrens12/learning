import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1. Import your translation files
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';

// 2. Load the preferred language from local storage (or default to English)
const storedLanguage = localStorage.getItem('app_lang') || 'English (US)';

// Map stored language values (display names or codes) to i18n language codes
const languageMap: Record<string, string> = {
  'English (US)': 'en',
  'Spanish (Español)': 'es',
  'French (Français)': 'fr',
  'Mandarin (中文)': 'zh',
  'Portuguese (Português)': 'pt',
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'zh': 'zh',
  'pt': 'pt'
};

const getLanguageCode = (stored: string): string => {
  return languageMap[stored] || 'en';
};

i18n
  .use(initReactI18next) // passes i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation }
    },
    lng: getLanguageCode(storedLanguage), // set the initial language
    fallbackLng: 'en', // use this language if a key is missing
    interpolation: {
      escapeValue: false // not needed for React
    }
  });

export default i18n;

