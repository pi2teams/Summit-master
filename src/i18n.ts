import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en/global.json'
import pt from './translations/pt/global.json'

const isProd = process.env.NODE_ENV === "production";

i18n.use(initReactI18next).init({
    debug: !isProd,
    fallbackLng: 'en',
    resources: {
        en: {
            translation: en
        },
        pt: {
            translation: pt
        }
    }
});

export default i18n;
