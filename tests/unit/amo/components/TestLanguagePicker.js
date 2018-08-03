import * as React from 'react';

import LanguagePicker, {
  LanguagePickerBase,
  changeLocaleURL,
} from 'amo/components/LanguagePicker';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  fakeI18n,
  createFakeLocation,
  createFakeEvent,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('LanguagePicker', () => {
    function renderLanguagePicker({
      currentLocale = 'en-US',
      ...otherProps
    } = {}) {
      const props = {
        i18n: fakeI18n(),
        location: createFakeLocation(),
        store: dispatchClientMetadata({ lang: currentLocale }).store,
        ...otherProps,
      };

      return shallowUntilTarget(
        <LanguagePicker {...props} />,
        LanguagePickerBase,
      );
    }

    it('renders a LanguagePicker', () => {
      const root = renderLanguagePicker();

      expect(root.find('.LanguagePicker')).toHaveLength(1);
    });

    it('selects the current locale', () => {
      const currentLocale = 'fr';
      const root = renderLanguagePicker({ currentLocale });

      expect(root.find('select')).toHaveProp('defaultValue', currentLocale);
    });

    it('changes the language on change', () => {
      const _window = { location: '/fr/firefox/' };

      const root = renderLanguagePicker({
        currentLocale: 'fr',
        location: createFakeLocation({ pathname: _window.location }),
        _window,
      });

      const fakeEvent = createFakeEvent({ target: { value: 'es' } });

      root.find('select').simulate('change', fakeEvent);

      sinon.assert.calledOnce(fakeEvent.preventDefault);
      expect(_window.location).toEqual('/es/firefox/');
    });
  });

  describe('changeLocaleURL', () => {
    it('changes the URL', () => {
      const newURL = changeLocaleURL({
        currentLocale: 'en-US',
        location: createFakeLocation({
          pathname: '/en-US/firefox/nowhere/',
          query: { page: 1, q: 'search' },
        }),
        newLocale: 'en-GB',
      });

      expect(newURL).toEqual('/en-GB/firefox/nowhere/?page=1&q=search');
    });

    it('handles URLs without query params', () => {
      const newURL = changeLocaleURL({
        currentLocale: 'en-US',
        location: createFakeLocation({ pathname: '/en-US/firefox/nowhere/' }),
        newLocale: 'ar',
      });

      expect(newURL).toEqual('/ar/firefox/nowhere/');
    });

    it('only changes the locale section of the URL', () => {
      const newURL = changeLocaleURL({
        currentLocale: 'en-US',
        location: createFakeLocation({
          pathname: '/en-US/firefox/en-US-to-en-GB-guide/',
          query: { foo: 'en-US' },
        }),
        newLocale: 'ar',
      });

      expect(newURL).toEqual('/ar/firefox/en-US-to-en-GB-guide/?foo=en-US');
    });
  });
});
