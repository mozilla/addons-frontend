import * as React from 'react';
import Helmet from 'react-helmet';

import HeadMetaTags, { HeadMetaTagsBase } from 'amo/components/HeadMetaTags';
import {
  dispatchClientMetadata,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      store: dispatchClientMetadata().store,
      description: 'some page desc',
      title: 'some page title',
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
      ['og:title', title],
      ['og:type', 'website'],
      ['og:url', `${baseURL}${pathname}`],
    ].forEach(([property, expectedValue]) => {
      expect(root.find(`meta[property="${property}"]`)).toHaveProp(
        'content',
        expectedValue,
      );
    });
  });

  it('does not render a "og:image" meta tag when is null', () => {
    const root = render({ image: null });

    expect(root.find(`meta[property="og:image"]`)).toHaveLength(0);
  });

  it('does not render a "og:image" meta tag when image is not defined', () => {
    const root = render({ image: undefined });

    expect(root.find(`meta[property="og:image"]`)).toHaveLength(0);
  });
});
