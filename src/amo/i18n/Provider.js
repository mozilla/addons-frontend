import React from 'react';
import { I18nextProvider } from 'react-i18next';

function I18nProvider({ i18n, children }) {
  const extended = {
    ...i18n,
    formatNumber(value) {
      // eslint-disable-next-line no-console
      console.log('formatting', value);
      return value;
    },
  };

  return <I18nextProvider i18n={extended}>{children}</I18nextProvider>;
}
export default I18nProvider;
