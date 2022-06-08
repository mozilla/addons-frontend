import { Helmet } from 'react-helmet';
import * as React from 'react';

import ServerHtml, { getStatic } from 'amo/components/ServerHtml';
import FakeApp, {
  fakeAssets,
  fakeSRIData,
} from 'tests/unit/amo/server/fakeApp';
import {
  getFakeConfig,
  getElement,
  getElements,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';
import { RTL } from 'amo/constants';

describe(__filename, () => {
  const _helmetCanUseDOM = Helmet.canUseDOM;

  beforeEach(() => {
    Helmet.canUseDOM = false;
  });

  afterEach(() => {
    Helmet.canUseDOM = _helmetCanUseDOM;
  });

  function render(opts = {}) {
    const pageProps = {
      appState: { appStateExample: { things: 'lots-of-things' } },
      assets: fakeAssets,
      component: <FakeApp />,
      includeSri: true,
      sriData: fakeSRIData,
      trackingEnabled: false,
      ...opts,
    };
    return defaultRender(<ServerHtml {...pageProps} />);
  }

  it('renders html attrs provided', () => {
    render({ htmlLang: 'ar', htmlDir: RTL });

    const html = screen.getByTagName('html');

    expect(html).toHaveAttribute('lang', 'ar');
    expect(html).toHaveAttribute('dir', RTL);
  });

  it('renders meta attrs inside helmet', async () => {
    render();

    expect(getElement('meta[name="description"]')).toHaveAttribute(
      'content',
      'test meta',
    );
  });

  it('renders script[type="application/ld+json"] inside helmet', () => {
    render();

    // This is defined in the `FakeApp` component.
    expect(
      getElement('script[type="application/ld+json"]'),
    ).toBeInTheDocument();
  });

  it('renders GA script when trackingEnabled is true', () => {
    render({ trackingEnabled: true });

    const ga = getElement(
      'script[src="https://www.google-analytics.com/analytics.js"]',
    );
    expect(ga).toHaveAttribute('async');
  });

  it("doesn't render GA script when trackingEnabled is false", () => {
    render({ trackingEnabled: false });

    expect(
      getElements(
        'script[src="https://www.google-analytics.com/analytics.js"]',
      ),
    ).toHaveLength(0);
  });

  it('renders css provided', () => {
    render();
    const styleSheets = getElements('link[rel="stylesheet"]');

    expect(styleSheets[0]).toHaveAttribute('href', '/bar/amo-blah.css');
    expect(styleSheets[1]).toHaveAttribute('href', '/search-blah.css');
  });

  it('renders js provided', () => {
    render();

    expect(getElements('script')[2]).toHaveAttribute('src', '/foo/amo-blah.js');
  });

  it('does not render i18n js in the assets list', () => {
    render();

    expect(getElements('script[integrity="sha512-amo-i18n-js"]')).toHaveLength(
      0,
    );
  });

  it('renders css with SRI when present', () => {
    render();
    const styleSheet = getElements('link[rel="stylesheet"]')[0];

    expect(styleSheet).toHaveAttribute('integrity', 'sha512-amo-css');
    expect(styleSheet).toHaveAttribute('crossOrigin', 'anonymous');
  });

  it('renders js with SRI when present', () => {
    render();
    const js = getElements('script')[2];

    expect(js).toHaveAttribute('integrity', 'sha512-amo-js');
    expect(js).toHaveAttribute('crossOrigin', 'anonymous');
  });

  it('renders state as JSON', () => {
    const appState = { usersExample: ['first-user', 'second-user'] };
    render({ appState });
    const json = getElement('#redux-store-state');

    expect(JSON.parse(json.innerHTML)).toEqual(appState);
  });

  it('renders meta with utf8 charset', () => {
    render();

    expect(getElement('meta[charset="utf-8"]')).toBeInTheDocument();
  });

  it('renders favicon', () => {
    const _config = getFakeConfig();
    render({ _config });

    expect(getElement('link[rel="shortcut icon"]')).toHaveAttribute(
      'href',
      `/favicon.ico?v=${_config.get('faviconVersion')}`,
    );
  });

  it('renders font link preload with SRI', () => {
    render();
    const preloaded = getElements('link[rel="preload"]')[0];

    expect(preloaded).toHaveAttribute(
      'href',
      'Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2',
    );
    expect(preloaded).toHaveAttribute('as', 'font');
    expect(preloaded).toHaveAttribute('type', 'font/woff2');
    expect(preloaded).not.toHaveAttribute('integrity');
    expect(preloaded).toHaveAttribute('crossOrigin', 'anonymous');
  });

  it('renders title', () => {
    render();

    expect(screen.getByText('test title')).toBeInTheDocument();
  });

  it('throws for unknown static type', () => {
    expect(() => {
      getStatic({ filePath: 'amo-foo', type: 'whatever', includeSri: false });
    }).toThrowError('Unknown static type');
  });

  it.each(['css', 'js'])('throws for missing SRI data', (type) => {
    expect(() => {
      getStatic({ filePath: 'amo-blah', type, includeSri: true, sriData: {} });
    }).toThrowError(/SRI Data is missing/);
  });

  it('does not render empty noscript styles', () => {
    render();

    expect(screen.queryByTagName('noscript')).not.toBeInTheDocument();
  });

  it('renders link[rel="canonical"] inside helmet', () => {
    render();
    // This is defined in the `FakeApp` component.
    expect(getElement('link[rel="canonical"]')).toBeInTheDocument();
  });
});
