import * as React from 'react';
import { waitFor } from '@testing-library/react';

import HeadLinks from 'amo/components/HeadLinks';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import { dispatchClientMetadata, getFakeConfig, getElement, getElements, render as defaultRender } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({
    location,
    ...props
  } = {}) => {
    const renderOptions = {
      initialEntries: [location || '/'],
      store,
    };
    return defaultRender(<HeadLinks {...props} />, renderOptions);
  };

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])('renders alternate links with hreflang for %s', async (clientApp) => {
    const baseURL = 'https://example.org';
    const lang = 'fr';
    const to = '/some-url';
    const _hrefLangs = ['fr', 'en-US'];

    const _config = getFakeConfig({
      baseURL,
    });

    dispatchClientMetadata({
      clientApp,
      lang,
      store,
    });
    const location = `/${lang}/${clientApp}${to}`;
    render({
      _config,
      _hrefLangs,
      location,
    });
    // Without the waitFor, the links have not rendered into the head yet.
    await waitFor(() => expect(getElement('link[rel="alternate"]')).toBeInTheDocument());
    expect(getElements('link[rel="alternate"]')).toHaveLength(_hrefLangs.length);

    _hrefLangs.forEach((locale) => {
      expect(getElement(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveAttribute('href', `${baseURL}/${locale}/${clientApp}${to}`);
    });
  });
  it('renders alternate links for aliased locales', async () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'de';
    const to = '/some-url';
    const _hrefLangs = ['x-default'];
    const aliasKey = 'x-default';
    const aliasValue = 'en-US';
    const hrefLangsMap = {
      [aliasKey]: aliasValue,
    };

    const _config = getFakeConfig({
      baseURL,
      hrefLangsMap,
    });

    dispatchClientMetadata({
      clientApp,
      lang,
      store,
    });
    const location = `/${lang}/${clientApp}${to}`;
    render({
      _config,
      _hrefLangs,
      location,
    });
    await waitFor(() => expect(getElement('link[rel="alternate"]')).toBeInTheDocument());
    expect(getElements('link[rel="alternate"]')).toHaveLength(_hrefLangs.length);
    expect(getElement(`link[rel="alternate"][hreflang="${aliasKey}"]`)).toHaveAttribute('href', `${baseURL}/${aliasValue}/${clientApp}${to}`);
  });
  it('does not render any links for unsupported alternate link locales', async () => {
    const lang = 'fr';
    const _hrefLangs = [lang, 'en-US'];

    // We mark the current locale as excluded.
    const _config = getFakeConfig({
      unsupportedHrefLangs: [lang],
    });

    dispatchClientMetadata({
      lang,
      store,
    });
    render({
      _config,
      _hrefLangs,
    });
    await waitFor(() => expect(getElement('link[rel="canonical"]')).toBeInTheDocument());
    expect(getElements('link[rel="alternate"]')).toHaveLength(0);
  });
  it('always renders a "canonical" link', async () => {
    const lang = 'fr';
    const _hrefLangs = [lang, 'en-US'];

    // We mark the current locale as excluded.
    const _config = getFakeConfig({
      unsupportedHrefLangs: [lang],
    });

    dispatchClientMetadata({
      lang,
      store,
    });
    render({
      _config,
      _hrefLangs,
    });
    await waitFor(() => expect(getElement('link[rel="canonical"]')).toBeInTheDocument());
  });
  // This test case ensures the production configuration is taken into account.
  it.each([['x-default', 'en-US'], ['pt', 'pt-PT'], ['en', 'en-US']])('renders a "%s" alternate link', async (hrefLang, locale) => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr';
    const to = '/some-url';

    const _config = getFakeConfig({
      baseURL,
    });

    dispatchClientMetadata({
      clientApp,
      lang,
      store,
    });
    const location = `/${lang}/${clientApp}${to}`;
    render({
      _config,
      location,
    });
    await waitFor(() => expect(getElement(`link[hrefLang="${hrefLang}"]`)).toBeInTheDocument());
    expect(getElement(`link[hreflang="${hrefLang}"]`)).toHaveAttribute('href', `${baseURL}/${locale}/${clientApp}${to}`);
  });
  it('renders a canonical link tag', async () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'de';
    const to = '/some-canonical-url';

    const _config = getFakeConfig({
      baseURL,
    });

    dispatchClientMetadata({
      clientApp,
      lang,
      store,
    });
    const location = `/${lang}/${clientApp}${to}`;
    render({
      _config,
      location,
    });
    await waitFor(() => expect(getElement('link[rel="canonical"]')).toBeInTheDocument());
    expect(getElement('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}/${lang}/${clientApp}${to}`);
  });
  it('does not render the "alternate" links when current URL is not the "canonical" URL', async () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'de';
    const to = '/some-url';
    const _hrefLangs = ['fr', 'en-US'];

    const _config = getFakeConfig({
      baseURL,
    });

    dispatchClientMetadata({
      clientApp,
      lang,
      store,
    });
    const location = `/${lang}/${clientApp}${to}?src=hotness`;
    render({
      _config,
      _hrefLangs,
      location,
    });
    await waitFor(() => expect(getElement('link[rel="canonical"]')).toBeInTheDocument());
    expect(getElements('link[rel="alternate"]')).toHaveLength(0);
  });
  it('accepts a queryString prop that is added to the URLs', async () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'de';
    const to = '/some-canonical-url';
    const queryString = '?foo=bar';

    const _config = getFakeConfig({
      baseURL,
    });

    dispatchClientMetadata({
      clientApp,
      lang,
      store,
    });
    const location = `/${lang}/${clientApp}${to}${queryString}`;
    render({
      _config,
      location,
      queryString,
    });
    await waitFor(() => expect(getElement('link[rel="canonical"]')).toBeInTheDocument());
    expect(getElement('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}/${lang}/${clientApp}${to}${queryString}`);
    expect(getElement(`link[hrefLang="${lang}"]`)).toHaveAttribute('href', `${baseURL}/${lang}/${clientApp}${to}${queryString}`);
  });
});