import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

let initialized = false;

export const init = async (lng, fallbackLng) => {
  if (!initialized) {
    await i18next.use(initReactI18next).init({
      debug: true,
      resources: {
        [lng]: {
          amo: {
            translation: 'This is a text',
          },
        },
      },
      lng,
      fallbackLng,
      ns: ['amo'],
      defaultNS: ['amo'],
      interpolation: {
        escapeValue: false,
      },
    });
    initialized = true;
  }

  return i18next;
};

export default i18next;
