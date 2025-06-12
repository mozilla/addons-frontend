import * as React from 'react';
import { waitFor } from '@testing-library/react';

import HeadMetaTags from 'amo/components/HeadMetaTags';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  dispatchClientMetadata,
  getFakeConfig,
  getElement,
  getElements,
  render as defaultRender,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({ location, ...props } = {}) => {
    const renderOptions = {
      initialEntries: [location || '/'],
      store,
    };
    return defaultRender(<HeadMetaTags {...props} />, renderOptions);
  };

  it('renders a description meta tag', async () => {
    const description = 'page desc here';

    render({ description });

    // Without the waitFor, the meta tags have not rendered into the head yet.
    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="description"]')).toHaveAttribute(
      'content',
      description,
    );
  });

  it('strips HTML from description meta tag', async () => {
    const description = 'page desc <b>here</b>';
    const expectedDescription = 'page desc here';

    render({ description });

    // Without the waitFor, the meta tags have not rendered into the head yet.
    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="description"]')).toHaveAttribute(
      'content',
      expectedDescription,
    );
  });

  it('does not render a "description" meta tag when description is not defined', async () => {
    render({ description: undefined });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements('meta[name="description"]')).toHaveLength(0);
  });

  it('does not render a "description" meta tag when description is null', async () => {
    render({ description: null });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements('meta[name="description"]')).toHaveLength(0);
  });

  it('renders a "date" meta tag', async () => {
    const date = Date.now();

    render({ date });

    await waitFor(() =>
      expect(getElement('meta[name="date"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="date"]')).toHaveAttribute(
      'content',
      String(date),
    );
  });

  it('does not render a "date" meta tag when date is not defined', async () => {
    render({ date: undefined });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements('meta[name="date"]')).toHaveLength(0);
  });

  it('does not render a "date" meta tag when date is null', async () => {
    render({ date: null });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements('meta[name="date"]')).toHaveLength(0);
  });

  it('renders a "last-modified" meta tag', async () => {
    const lastModified = Date.now();

    render({ lastModified });

    await waitFor(() =>
      expect(getElement('meta[name="last-modified"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="last-modified"]')).toHaveAttribute(
      'content',
      String(lastModified),
    );
  });

  it('does not render a "last-modified" meta tag when lastModified is not defined', async () => {
    render({ lastModified: undefined });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements('meta[name="last-modified"]')).toHaveLength(0);
  });

  it('does not render a "last-modified" meta tag when lastModified is null', async () => {
    render({ lastModified: null });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements('meta[name="last-modified"]')).toHaveLength(0);
  });

  it('renders Open Graph meta tags', async () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });

    const description = 'page desc';
    const image = 'https://example.com/image.png';
    const title = 'page title';

    const lang = 'fr';
    const pathname = '/foo';
    dispatchClientMetadata({ lang, store });
    const location = pathname;

    render({ _config, description, image, title, location });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    [
      ['og:description', description],
      ['og:image', image],
      ['og:locale', lang],
      ['og:type', 'website'],
      ['og:url', `${baseURL}${pathname}`],
    ].forEach(([property, expectedValue]) => {
      expect(getElement(`meta[property="${property}"]`)).toHaveAttribute(
        'content',
        expectedValue,
      );
    });

    expect(getElement('meta[property="og:title"]')).toHaveAttribute(
      'content',
      expect.stringMatching(new RegExp(title)),
    );
  });

  it('renders a default image in "og:image" meta tag when image is null', async () => {
    render({ image: null });

    await waitFor(() =>
      expect(getElement('meta[property="og:image"]')).toBeInTheDocument(),
    );

    expect(getElement(`meta[property="og:image"]`)).toHaveAttribute(
      'content',
      'default-og-image.png',
    );
  });

  it('renders a default image in "og:image" meta tag when image is not defined', async () => {
    render({ image: undefined });

    await waitFor(() =>
      expect(getElement('meta[property="og:image"]')).toBeInTheDocument(),
    );

    expect(getElement(`meta[property="og:image"]`)).toHaveAttribute(
      'content',
      'default-og-image.png',
    );
  });

  it('does not render a "og:description" meta tag when description is null', async () => {
    render({ description: null });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements(`meta[property="og:description"]`)).toHaveLength(0);
  });

  it('does not render a "og:description" meta tag when description is not defined', async () => {
    render({ description: undefined });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElements(`meta[property="og:description"]`)).toHaveLength(0);
  });

  it('does not append the default title in the "og:title" meta tag when `appendDefaultTitle` is `false`', async () => {
    const title = 'some title';

    render({ title, appendDefaultTitle: false });

    await waitFor(() =>
      expect(getElement('meta[property="og:type"]')).toBeInTheDocument(),
    );

    expect(getElement(`meta[property="og:title"]`)).toHaveAttribute(
      'content',
      title,
    );
  });

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'appends a default %s title in the "og:title" meta tag when title is supplied',
    async (clientApp) => {
      const title = 'some title';
      const lang = 'fr';
      dispatchClientMetadata({ clientApp, lang, store });

      render({ title });

      await waitFor(() =>
        expect(getElement('meta[property="og:title"]')).toBeInTheDocument(),
      );

      expect(getElement('meta[property="og:title"]')).toHaveAttribute(
        'content',
        expect.stringMatching(
          new RegExp(
            `^${title} – Add-ons for Firefox( Android)? \\(${lang}\\)$`,
          ),
        ),
      );
    },
  );

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'uses the default %s title in the "og:title" meta tag when title is not supplied',
    async (clientApp) => {
      const lang = 'fr';
      dispatchClientMetadata({ clientApp, lang, store });

      render({ title: null });

      await waitFor(() =>
        expect(getElement('meta[property="og:title"]')).toBeInTheDocument(),
      );

      expect(getElement(`meta[property="og:title"]`)).toHaveAttribute(
        'content',
        expect.stringMatching(
          new RegExp(`^Add-ons for Firefox( Android)? \\(${lang}\\)$`),
        ),
      );
    },
  );
});
