import * as React from 'react';

import HrefLang, { HrefLangBase } from 'amo/components/HrefLang';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import {
  dispatchClientMetadata,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <HrefLang store={store} to="/foo" {...props} />,
      HrefLangBase,
    );
  };

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'renders alternate links with hreflang for %s',
    (clientApp) => {
      const baseURL = 'https://example.org';
      const to = '/some-url';

      const _hrefLangs = ['fr', 'en-US'];
      const _config = getFakeConfig({ baseURL });
      const { store } = dispatchClientMetadata({ clientApp });

      const root = render({ _config, _hrefLangs, store, to });

      expect(root.find('link[rel="alternate"]')).toHaveLength(
        _hrefLangs.length,
      );
      _hrefLangs.forEach((locale, index) => {
        expect(root.find('link[rel="alternate"]').at(index)).toHaveProp(
          'hrefLang',
          locale,
        );
        expect(root.find('link[rel="alternate"]').at(index)).toHaveProp(
          'href',
          `${baseURL}/${locale}/${clientApp}${to}`,
        );
      });
    },
  );

  it('renders alternate links for aliased locales', () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const to = '/some-url';

    const _hrefLangs = ['x-default'];
    const aliasKey = 'x-default';
    const aliasValue = 'en-US';
    const hrefLangsMap = {
      [aliasKey]: aliasValue,
    };

    const _config = getFakeConfig({ baseURL, hrefLangsMap });
    const { store } = dispatchClientMetadata({ clientApp });

    const root = render({ _config, _hrefLangs, store, to });

    expect(root.find('link[rel="alternate"]')).toHaveLength(_hrefLangs.length);
    expect(root.find('link[rel="alternate"]').at(0)).toHaveProp(
      'hrefLang',
      aliasKey,
    );
    expect(root.find('link[rel="alternate"]').at(0)).toHaveProp(
      'href',
      `${baseURL}/${aliasValue}/${clientApp}${to}`,
    );
  });

  it('does not render any links for unsupported alternate link locales', () => {
    const lang = 'fr';
    const _hrefLangs = [lang, 'en-US'];
    // We mark the current locale as excluded.
    const _config = getFakeConfig({ unsupportedHrefLangs: [lang] });
    const { store } = dispatchClientMetadata({ lang });

    const root = render({ _config, _hrefLangs, store });

    expect(root.find('link[rel="alternate"]')).toHaveLength(0);
  });

  // This test case ensures the production configuration is taken into account.
  it.each([['x-default', 'en-US'], ['pt', 'pt-PT'], ['en', 'en-US']])(
    'renders a "%s" alternate link',
    (hrefLang, locale) => {
      const baseURL = 'https://example.org';
      const clientApp = CLIENT_APP_FIREFOX;
      const to = '/some-url';

      const _config = getFakeConfig({ baseURL });
      const { store } = dispatchClientMetadata({ clientApp });

      const root = render({ _config, store, to });

      expect(root.find(`link[hrefLang="${hrefLang}"]`)).toHaveProp(
        'href',
        `${baseURL}/${locale}/${clientApp}${to}`,
      );
    },
  );
});
