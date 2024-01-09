export const NAMESPACES = {
  amo: "amo",
} as const;

export const SUPPORTED_LANGUAGES = {
  en: "en",
  es: "es",
} as const;

export default {
  debug: true,
  // This is the list of languages your application supports
  supportedLngs: [SUPPORTED_LANGUAGES.en, SUPPORTED_LANGUAGES.es],
  // This is the language you want to use in case
  // if the user language is not in the supportedLngs
  fallbackLng: SUPPORTED_LANGUAGES.en,
  // The default namespace of i18next is "translation", but you can customize it here
  defaultNS: NAMESPACES.amo,
  // Disabling suspense is recommended
  react: { useSuspense: false },
};
