/* global window */
import * as React from 'react';
import userEvent from '@testing-library/user-event';

import LanguagePicker, { changeLocaleURL } from 'amo/components/LanguagePicker';
import {
  dispatchClientMetadata,
  createFakeLocation,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('LanguagePicker', () => {
    const savedLocation = window.location;

    afterEach(() => {
      window.location = savedLocation;
    });

    beforeEach(() => {
      delete window.location;
    });

    function renderLanguagePicker({ lang = 'en-US', ...props } = {}) {
      const path = `/${lang}/firefox/`;
      window.location = new URL(`https://example.org${path}`);
      const { store } = dispatchClientMetadata({ lang });
      return defaultRender(<LanguagePicker {...props} />, {
        store,
        initialEntries: [path],
      });
    }

    it('renders a LanguagePicker', () => {
      renderLanguagePicker();

      expect(
        screen.getByRole('combobox', { name: 'Change language' }),
      ).toBeInTheDocument();
    });

    it('selects the current locale', () => {
      renderLanguagePicker({ lang: 'fr' });

      expect(screen.getByRole('option', { name: 'Français' }).selected).toBe(
        true,
      );
      expect(screen.getByRole('option', { name: 'Français' }).value).toBe('fr');
    });

    it('changes the language on change', () => {
      renderLanguagePicker({ lang: 'fr' });
      expect(window.location.pathname).toEqual('/fr/firefox/');

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Change language' }),
        screen.getByRole('option', { name: 'Español' }),
      );

      expect(window.location).toEqual('/es/firefox/');
    });
  });

  describe('changeLocaleURL', () => {
    it('changes the URL', () => {
      const newURL = changeLocaleURL({
        currentLocale: 'en-US',
        location: createFakeLocation({
          pathname: '/en-US/firefox/nowhere/',
          query: { page: '1', q: 'search' },
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
