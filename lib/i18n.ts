import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Imported statically to ensure translations are available on both SSR and client,
// preventing hydration mismatches from i18n async loading.
import translationId from "../public/locales/id/translation.json";
import translationEn from "../public/locales/en/translation.json";

const savedLang =
  typeof window !== "undefined"
    ? ((localStorage.getItem("arcade_lang") as "id" | "en" | null) ?? "en")
    : "en";

i18n
  .use(initReactI18next)
  .init({
    lng: savedLang,
    fallbackLng: "en",
    supportedLngs: ["id", "en"],
    defaultNS: "translation",
    ns: ["translation"],
    resources: {
      id: { translation: translationId },
      en: { translation: translationEn },
    },
    interpolation: {
      escapeValue: false,
    },
    initImmediate: false,
  });

export default i18n;
