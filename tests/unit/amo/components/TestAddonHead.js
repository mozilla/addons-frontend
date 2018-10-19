import * as React from 'react';
import Helmet from 'react-helmet';

import AddonHead, { AddonHeadBase } from 'amo/components/AddonHead';
import {
  ADDON_TYPE_COMPLETE_THEME,
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeTheme,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <AddonHead i18n={fakeI18n()} store={store} {...props} />,
      AddonHeadBase,
    );
  };

  it('renders nothing when no add-on is passed', () => {
    const root = render();

    expect(root.find(Helmet)).toHaveLength(0);
  });

  it.each([
    [ADDON_TYPE_DICT, 'Dictionary'],
    [ADDON_TYPE_EXTENSION, 'Extension'],
    [ADDON_TYPE_LANG, 'Language Pack'],
    [ADDON_TYPE_OPENSEARCH, 'Search Tool'],
    [ADDON_TYPE_STATIC_THEME, 'Theme'],
    [ADDON_TYPE_THEME, 'Theme'],
    [ADDON_TYPE_COMPLETE_THEME, 'Add-on'],
  ])('renders an HTML title for Firefox (add-on type: %s)', (type, name) => {
    const lang = 'fr';
    const addon = createInternalAddon({ ...fakeAddon, type });
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      lang,
    });
    const root = render({ addon, store });

    expect(root.find('title')).toHaveText(
      `${addon.name} – Get this ${name} for 🦊 Firefox (${lang})`,
    );
  });

  it.each([
    [ADDON_TYPE_DICT, 'Dictionary'],
    [ADDON_TYPE_EXTENSION, 'Extension'],
    [ADDON_TYPE_LANG, 'Language Pack'],
    [ADDON_TYPE_OPENSEARCH, 'Search Tool'],
    [ADDON_TYPE_STATIC_THEME, 'Theme'],
    [ADDON_TYPE_THEME, 'Theme'],
    [ADDON_TYPE_COMPLETE_THEME, 'Add-on'],
  ])('renders an HTML title for Android (add-on type: %s)', (type, name) => {
    const lang = 'fr';
    const addon = createInternalAddon({ ...fakeAddon, type });
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
      lang,
    });
    const root = render({ addon, store });

    expect(root.find('title')).toHaveText(
      `${addon.name} – Get this ${name} for 🦊 Android (${lang})`,
    );
  });

  it('renders a description meta tag containing the add-on summary', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find('meta[name="description"]')).toHaveLength(1);
    expect(root.find('meta[name="description"]')).toHaveProp(
      'content',
      `Download ${addon.name} for Firefox. ${addon.summary}`,
    );
  });

  it('renders Open Graph meta tags', () => {
    const lang = 'fr';
    const addon = createInternalAddon(fakeAddon);
    const { store } = dispatchClientMetadata({ lang });
    const root = render({ addon, store });

    [
      ['og:type', 'website'],
      ['og:url', addon.url],
      ['og:locale', lang],
      ['og:image', addon.previews[0].image_url],
    ].forEach(([property, expectedValue]) => {
      expect(root.find(`meta[property="${property}"]`)).toHaveProp(
        'content',
        expectedValue,
      );
    });

    expect(root.find(`meta[property="og:title"]`).prop('content')).toContain(
      addon.name,
    );
    expect(
      root.find(`meta[property="og:description"]`).prop('content'),
    ).toContain(addon.summary);
  });

  it('does not render a "og:image" meta tag if add-on has no previews', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      previews: [],
    });
    const root = render({ addon });

    expect(root.find(`meta[property="og:image"]`)).toHaveLength(0);
  });

  it('renders a "og:image" meta tag with the preview URL if add-on is a lightweight theme', () => {
    const addon = createInternalAddon(fakeTheme);
    const root = render({ addon });

    expect(root.find(`meta[property="og:image"]`)).toHaveLength(1);
    expect(root.find(`meta[property="og:image"]`)).toHaveProp(
      'content',
      addon.themeData.previewURL,
    );
  });

  it('does not render a "og:image" meta tag if lightweight theme does not have a preview URL', () => {
    const addon = createInternalAddon({
      ...fakeTheme,
      theme_data: {
        ...fakeTheme.theme_data,
        previewURL: null,
      },
    });
    const root = render({ addon });

    expect(root.find(`meta[property="og:image"]`)).toHaveLength(0);
  });

  it('renders a canonical link tag', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp('href', addon.url);
  });

  it('renders JSON linked data', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find('script[type="application/ld+json"]')).toHaveLength(1);
  });

  it('renders a "date" meta tag', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find('meta[name="date"]')).toHaveLength(1);
    expect(root.find('meta[name="date"]')).toHaveProp('content', addon.created);
  });

  it('renders a "last-modified" meta tag', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find('meta[name="last-modified"]')).toHaveLength(1);
    expect(root.find('meta[name="last-modified"]')).toHaveProp(
      'content',
      addon.last_updated,
    );
  });

  it('does not render a "last-modified" meta tag when date is not defined', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      last_updated: null,
    });
    const root = render({ addon });

    expect(root.find('meta[name="last-modified"]')).toHaveLength(0);
  });
});
