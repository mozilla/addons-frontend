import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { langToLocale } from 'amo/i18n/utils';
import defaultConfig from 'config';

let initialized = false;

const defaultLocale = langToLocale(defaultConfig.get('defaultLang'));

export const config = {
  debug: true,
  ns: ['amo'],
  defaultNS: ['amo'],
  interpolation: {
    escapeValue: false,
  },
  fallbackLng: defaultLocale,
};

export const init = async (extendedConfig, middleware = []) => {
  const finalConfig = {
    ...config,
    ...extendedConfig,
  };
  if (!initialized) {
    let current = i18next;

    for (const item of middleware) {
      current = current.use(item);
    }

    current.use(initReactI18next);

    await current.init(finalConfig);

    initialized = true;
  }

  return i18next;
};

export default i18next;
