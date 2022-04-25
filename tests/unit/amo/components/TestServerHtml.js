import { shallow } from 'enzyme';
import { Helmet } from 'react-helmet';
import * as React from 'react';

import ServerHtml from 'amo/components/ServerHtml';
import FakeApp, {
  fakeAssets,
  fakeSRIData,
} from 'tests/unit/amo/server/fakeApp';
import { getFakeConfig } from 'tests/unit/helpers';
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
    return shallow(<ServerHtml {...pageProps} />);
  }

  it('renders html attrs provided', () => {
    const root = render({ htmlLang: 'ar', htmlDir: RTL });
    const html = root.find('html');

    expect(html).toHaveProp('lang', 'ar');
    expect(html).toHaveProp('dir', RTL);
  });

  it('renders meta attrs inside helmet', () => {
    const root = render();
    const meta = root.find({ name: 'description' });

    expect(meta).toHaveProp('content', 'test meta');
  });

  it('renders script[type="application/ld+json"] inside helmet', () => {
    const root = render();
    // This is defined in the `FakeApp` component.
    const script = root.find('script[type="application/ld+json"]');

    expect(script).toHaveLength(1);
  });

  it('renders GA script when trackingEnabled is true', () => {
    const root = render({ trackingEnabled: true });
    const ga = root.find({
      src: 'https://www.google-analytics.com/analytics.js',
    });

    expect(ga).toHaveLength(1);
    expect(ga).toHaveProp('async', true);
  });

  it("doesn't render GA script when trackingEnabled is false", () => {
    const root = render({ trackingEnabled: false });
    const ga = root.find({
      src: 'https://www.google-analytics.com/analytics.js',
    });

    expect(ga).toHaveLength(0);
  });

  it('renders css provided', () => {
    const root = render();
    const styleSheets = root.find({ rel: 'stylesheet' });

    expect(styleSheets.at(0)).toHaveProp('href', '/bar/amo-blah.css');
    expect(styleSheets.at(1)).toHaveProp('href', '/search-blah.css');
  });

  it('renders js provided', () => {
    const root = render();
    const js = root.find('script');

    expect(js.at(2)).toHaveProp('src', '/foo/amo-blah.js');
  });

  it('does not render i18n js in the assets list', () => {
    const root = render();
    const js = root.find('script[integrity="sha512-amo-i18n-js"]');
    expect(js.exists()).toEqual(false);
  });

  it('renders css with SRI when present', () => {
    const root = render();
    const styleSheets = root.find({ rel: 'stylesheet' });

    expect(styleSheets.at(0)).toHaveProp('integrity', 'sha512-amo-css');
    expect(styleSheets.at(0)).toHaveProp('crossOrigin', 'anonymous');
  });

  it('renders js with SRI when present', () => {
    const root = render();
    const js = root.find('script');

    expect(js.at(2)).toHaveProp('integrity', 'sha512-amo-js');
    expect(js.at(2)).toHaveProp('crossOrigin', 'anonymous');
  });

  it('renders state as JSON', () => {
    const appState = { usersExample: ['first-user', 'second-user'] };
    const root = render({ appState });
    const json = root.find('#redux-store-state');

    expect(json).toHaveLength(1);
    expect(JSON.parse(json.prop('dangerouslySetInnerHTML').__html)).toEqual(
      appState,
    );
  });

  it('renders meta with utf8 charset', () => {
    const root = render();
    const meta = root.find({ charSet: 'utf-8' });

    expect(meta).toHaveLength(1);
  });

  it('renders favicon', () => {
    const _config = getFakeConfig();

    const root = render({ _config });
    const favicon = root.find('link[rel="shortcut icon"]');

    expect(favicon).toHaveProp(
      'href',
      `/favicon.ico?v=${_config.get('faviconVersion')}`,
    );
  });

  it('renders font link preload with SRI', () => {
    const root = render();
    const preloaded = root.find({ rel: 'preload' });

    expect(preloaded.at(0)).toHaveProp(
      'href',
      'Inter-roman-subset-en_de_fr_ru_es_pt_pl_it.var.woff2',
    );
    expect(preloaded.at(0)).toHaveProp('as', 'font');
    expect(preloaded.at(0)).toHaveProp('type', 'font/woff2');
    expect(preloaded.at(0)).not.toHaveProp('integrity');
    expect(preloaded.at(0)).toHaveProp('crossOrigin', 'anonymous');
  });

  it('renders title', () => {
    const root = render();

    expect(root.find('title')).toHaveText('test title');
  });

  it('throws for unknown static type', () => {
    expect(() => {
      const root = render({ includeSri: false });
      root.instance().getStatic({ filePath: 'amo-foo', type: 'whatever' });
    }).toThrowError('Unknown static type');
  });

  it.each(['css', 'js'])('throws for missing SRI data', (type) => {
    expect(() => {
      const root = render();
      root.instance().getStatic({ filePath: 'amo-blah', type });
    }).toThrowError(/SRI Data is missing/);
  });

  it('does not render empty noscript styles', () => {
    const root = render();

    expect(root.find('noscript')).toHaveLength(0);
  });

  it('renders link[rel="canonical"] inside helmet', () => {
    const root = render();
    // This is defined in the `FakeApp` component.
    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
  });
});
