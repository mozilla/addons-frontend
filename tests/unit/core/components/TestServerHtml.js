import { shallow } from 'enzyme';
import Helmet from 'react-helmet';
import * as React from 'react';

import ServerHtml from 'core/components/ServerHtml';
import FakeApp, {
  fakeAssets,
  fakeSRIData,
} from 'tests/unit/core/server/fakeApp';
import { getFakeConfig } from 'tests/unit/helpers';
import { RTL } from 'core/constants';

describe(__filename, () => {
  const _helmetCanUseDOM = Helmet.canUseDOM;

  beforeEach(() => {
    Helmet.canUseDOM = false;
  });

  afterEach(() => {
    Helmet.canUseDOM = _helmetCanUseDOM;
  });

  const fakeStore = {
    getState: () => ({ foo: 'bar' }),
  };

  function render(opts = {}) {
    const pageProps = {
      appName: 'disco',
      component: <FakeApp />,
      assets: fakeAssets,
      includeSri: true,
      store: fakeStore,
      trackingEnabled: false,
      sriData: fakeSRIData,
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

    expect(styleSheets).toHaveLength(1);
    expect(styleSheets.at(0)).toHaveProp('href', '/bar/disco-blah.css');
  });

  it('renders js provided', () => {
    const root = render();
    const js = root.find('script');

    expect(js.at(1)).toHaveProp('src', '/foo/disco-blah.js');
  });

  it('does not render i18n js in the assets list', () => {
    const root = render();
    const js = root.find('script[integrity="sha512-disco-i18n-js"]');
    expect(js.exists()).toEqual(false);
  });

  it('does not render hct lib js in the assets list', () => {
    const root = render();
    const js = root.find('script[integrity="sha512-disco-hct-js"]');
    expect(js.exists()).toEqual(false);
  });

  it('renders css with SRI when present', () => {
    const root = render();
    const styleSheets = root.find({ rel: 'stylesheet' });

    expect(styleSheets.at(0)).toHaveProp('integrity', 'sha512-disco-css');
    expect(styleSheets.at(0)).toHaveProp('crossOrigin', 'anonymous');
  });

  it('renders js with SRI when present', () => {
    const root = render();
    const js = root.find('script');

    expect(js.at(1)).toHaveProp('integrity', 'sha512-disco-js');
    expect(js.at(1)).toHaveProp('crossOrigin', 'anonymous');
  });

  it('renders state as JSON', () => {
    const store = fakeStore;
    const root = render({ store });
    const json = root.find('#redux-store-state');

    expect(json).toHaveLength(1);
    expect(JSON.parse(json.prop('dangerouslySetInnerHTML').__html)).toEqual(
      store.getState(),
    );
  });

  it('renders meta with utf8 charset ', () => {
    const root = render();
    const meta = root.find({ charSet: 'utf-8' });

    expect(meta).toHaveLength(1);
  });

  it('renders favicon', () => {
    const amoCDN = 'https://test.cdn.net';
    const _config = getFakeConfig({ amoCDN });

    const root = render({ _config });
    const favicon = root.find('link[rel="shortcut icon"]');

    expect(favicon).toHaveProp(
      'href',
      `${amoCDN}/favicon.ico?v=${_config.get('faviconVersion')}`,
    );
  });

  it('renders title', () => {
    const root = render();

    expect(root.find('title')).toHaveText('test title');
  });

  it('throws for unknown static type', () => {
    expect(() => {
      const root = render({ includeSri: false });
      root.instance().getStatic({ filePath: 'disco-foo', type: 'whatever' });
    }).toThrowError('Unknown static type');
  });

  it('throws for missing SRI data', () => {
    expect(() => {
      const root = render();
      root.instance().getStatic({ filePath: 'disco-blah' });
    }).toThrowError(/SRI Data is missing/);
  });

  it('does not render empty noscript styles', () => {
    const root = render();

    expect(root.find('noscript')).toHaveLength(0);
  });

  it('renders noscript styles when provided', () => {
    const noScriptStyles = '.MyComponent { display: none; }';
    const root = render({ noScriptStyles });

    expect(root.find('noscript')).toHaveLength(1);
    expect(root.find('noscript').html()).toContain(noScriptStyles);
  });

  it('renders link[rel="canonical"] inside helmet', () => {
    const root = render();
    // This is defined in the `FakeApp` component.
    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
  });
});
