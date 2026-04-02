import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import mnCommon from './locales/mn/common.json'
import mnAuth from './locales/mn/auth.json'
import mnSurvey from './locales/mn/survey.json'
import mnWallet from './locales/mn/wallet.json'
import mnNav from './locales/mn/nav.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enSurvey from './locales/en/survey.json'
import enWallet from './locales/en/wallet.json'
import enNav from './locales/en/nav.json'

import koCommon from './locales/ko/common.json'
import koAuth from './locales/ko/auth.json'
import koSurvey from './locales/ko/survey.json'
import koWallet from './locales/ko/wallet.json'
import koNav from './locales/ko/nav.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      mn: { common: mnCommon, auth: mnAuth, survey: mnSurvey, wallet: mnWallet, nav: mnNav },
      en: { common: enCommon, auth: enAuth, survey: enSurvey, wallet: enWallet, nav: enNav },
      ko: { common: koCommon, auth: koAuth, survey: koSurvey, wallet: koWallet, nav: koNav },
    },
    fallbackLng: 'mn',
    supportedLngs: ['mn', 'en', 'ko'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'survey', 'wallet', 'nav'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

// Sync html lang attribute
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n
