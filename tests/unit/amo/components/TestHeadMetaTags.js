import * as React from 'react';
import { Helmet } from 'react-helmet';

import HeadMetaTags, { HeadMetaTagsBase } from 'amo/components/HeadMetaTags';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  dispatchClientMetadata,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(<HeadMetaTags {...allProps} />, HeadMetaTagsBase);
  };

  it('renders a Helmet component', () => {
    const root = render();

    expect(root.find(Helmet)).toHaveLength(1);
  });

  it('renders a description meta tag', () => {
    const description = 'page desc here';

    const root = render({ description });

    expect(root.find('meta[name="description"]')).toHaveLength(1);
  });

  it('does not render a "description" meta tag when description is not defined', () => {
    const root = render({ description: undefined });

    expect(root.find('meta[name="description"]')).toHaveLength(0);
  });

  it('does not render a "description" meta tag when description is null', () => {
    const root = render({ description: null });

    expect(root.find('meta[name="description"]')).toHaveLength(0);
  });

  it('renders a "date" meta tag', () => {
    const date = Date.now();

    const root = render({ date });

    expect(root.find('meta[name="date"]')).toHaveLength(1);
    expect(root.find('meta[name="date"]')).toHaveProp('content', date);
  });

  it('does not render a "date" meta tag when date is not defined', () => {
    const root = render({ date: undefined });

    expect(root.find('meta[name="date"]')).toHaveLength(0);
  });

  it('does not render a "date" meta tag when date is null', () => {
    const root = render({ date: null });

    expect(root.find('meta[name="date"]')).toHaveLength(0);
  });

  it('renders a "last-modified" meta tag', () => {
    const lastModified = Date.now();

    const root = render({ lastModified });

    expect(root.find('meta[name="last-modified"]')).toHaveLength(1);
    expect(root.find('meta[name="last-modified"]')).toHaveProp(
      'content',
      lastModified,
    );
  });

  it('does not render a "last-modified" meta tag when lastModified is not defined', () => {
    const root = render({ lastModified: undefined });

    expect(root.find('meta[name="last-modified"]')).toHaveLength(0);
  });

  it('does not render a "last-modified" meta tag when lastModified is null', () => {
    const root = render({ lastModified: null });

    expect(root.find('meta[name="last-modified"]')).toHaveLength(0);
  });

  it('renders Open Graph meta tags', () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });

    const description = 'page desc';
    const image = 'https://example.com/image.png';
    const title = 'page title';

    const lang = 'fr';
    const pathname = '/foo';
    const { store } = dispatchClientMetadata({ lang, pathname });

    const root = render({ _config, description, image, title, store });

    [
      ['og:description', description],
      ['og:image', image],
      ['og:locale', lang],
      ['og:type', 'website'],
      ['og:url', `${baseURL}${pathname}`],
    ].forEach(([property, expectedValue]) => {
      expect(root.find(`meta[property="${property}"]`)).toHaveProp(
        'content',
        expectedValue,
      );
    });

    expect(root.find(`meta[property="og:title"]`)).toHaveLength(1);
    expect(root.find(`meta[property="og:title"]`).prop('content')).toContain(
      title,
    );
  });

  it('renders a default image in "og:image" meta tag when image is null', () => {
    const root = render({ image: null });

    expect(root.find(`meta[property="og:image"]`)).toHaveProp(
      'content',
      'default-og-image.png',
    );
  });

  it('renders a default image in "og:image" meta tag when image is not defined', () => {
    const root = render({ image: undefined });

    expect(root.find(`meta[property="og:image"]`)).toHaveProp(
      'content',
      'default-og-image.png',
    );
  });

  it('does not render a "og:description" meta tag when description is null', () => {
    const root = render({ description: null });

    expect(root.find(`meta[property="og:description"]`)).toHaveLength(0);
  });

  it('does not render a "og:description" meta tag when description is not defined', () => {
    const root = render({ description: undefined });

    expect(root.find(`meta[property="og:description"]`)).toHaveLength(0);
  });

  it('does not append the default title in the "og:title" meta tag when `appendDefaultTitle` is `false`', () => {
    const title = 'some title';

    const root = render({ title, appendDefaultTitle: false });

    expect(root.find(`meta[property="og:title"]`).prop('content')).toEqual(
      title,
    );
  });

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'appends a default %s title in the "og:title" meta tag when title is supplied',
    (clientApp) => {
      const title = 'some title';
      const lang = 'fr';
      const { store } = dispatchClientMetadata({ clientApp, lang });

      const root = render({ store, title });

      expect(root.find(`meta[property="og:title"]`).prop('content')).toMatch(
        new RegExp(`^${title} – Add-ons for Firefox( Android)? \\(${lang}\\)$`),
      );
    },
  );

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'uses the default %s title in the "og:title" meta tag when title is not supplied',
    (clientApp) => {
      const lang = 'fr';
      const { store } = dispatchClientMetadata({ clientApp, lang });

      const root = render({ store, title: null });

      expect(root.find(`meta[property="og:title"]`).prop('content')).toMatch(
        new RegExp(`^Add-ons for Firefox( Android)? \\(${lang}\\)$`),
      );
    },
  );

  it('does not render Twitter meta tags by default', () => {
    const root = render();

    ['twitter:site', 'twitter:card'].forEach((name) => {
      expect(root.find(`meta[name="${name}"]`)).toHaveLength(0);
    });
  });

  it('renders Twitter meta tags when withTwitterMeta is true', () => {
    const root = render({ withTwitterMeta: true });

    [
      ['twitter:site', '@mozamo'],
      ['twitter:card', 'summary_large_image'],
    ].forEach(([name, expectedValue]) => {
      expect(root.find(`meta[name="${name}"]`)).toHaveProp(
        'content',
        expectedValue,
      );
    });
  });
});
