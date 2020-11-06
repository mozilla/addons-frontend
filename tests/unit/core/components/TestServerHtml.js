import { shallow } from 'enzyme';
import { Helmet } from 'react-helmet';
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

  const createFakeChunkExtractor = (props = {}) => {
    return {
      getLinkElements: sinon.stub(),
      getMainAssets: sinon.stub().returns([]),
      getPreAssets: sinon.stub().returns([]),
      getRequiredChunksScriptElements: sinon.stub(),
      ...props,
    };
  };

  function render(opts = {}) {
    const pageProps = {
      appState: { appStateExample: { things: 'lots-of-things' } },
      assets: fakeAssets,
      chunkExtractor: createFakeChunkExtractor(),
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

    expect(styleSheets).toHaveLength(1);
    expect(styleSheets.at(0)).toHaveProp('href', '/bar/amo-blah.css');
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
      root.instance().getStatic({ filePath: 'amo-foo', type: 'whatever' });
    }).toThrowError('Unknown static type');
  });

  it('throws for missing SRI data', () => {
    expect(() => {
      const root = render();
      root.instance().getStatic({ filePath: 'amo-blah' });
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

  describe('renderStyles()', () => {
    it('renders a "link" tag for the main "style" asset', () => {
      const asset = { chunk: 'foo', url: '/foo.css' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [asset],
      });

      const root = render({ chunkExtractor, includeSri: false });

      expect(root.find('link[data-chunk]')).toHaveLength(1);

      const link = root.find(`link[data-chunk="${asset.chunk}"]`);
      expect(link).toHaveProp('href', asset.url);
      expect(link).toHaveProp('rel', 'stylesheet');
    });

    it('excludes the amo bundle', () => {
      const fooAsset = { chunk: 'foo', url: '/foo.css' };
      const mainAsset = { chunk: 'amo', url: '/main.css' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [fooAsset, mainAsset],
      });

      const root = render({ chunkExtractor, includeSri: false });

      expect(root.find('link[data-chunk]')).toHaveLength(1);
      expect(root.find(`link[data-chunk="${mainAsset.chunk}"]`)).toHaveLength(
        0,
      );
    });

    it('throws an error when SRI data are not found', () => {
      const asset = { chunk: 'foo', url: '/foo.css', filename: 'foo.css' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [asset],
      });
      const sriData = {
        ...fakeSRIData,
        [asset.filename]: undefined,
      };

      expect(() => {
        render({ chunkExtractor, includeSri: true, sriData });
      }).toThrow(`SRI Data is missing for "${asset.filename}"`);
    });

    it('adds SRI props when `includeSri` prop is set to `true`', () => {
      const asset = { chunk: 'foo', url: '/foo.css', filename: 'foo.css' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [asset],
      });
      const sriData = {
        ...fakeSRIData,
        [asset.filename]: 'sha512-something-something',
      };

      const root = render({ chunkExtractor, includeSri: true, sriData });

      const link = root.find(`link[data-chunk="${asset.chunk}"]`);
      expect(link).toHaveProp('crossOrigin', 'anonymous');
      expect(link).toHaveProp('integrity', sriData[asset.filename]);
    });
  });

  describe('renderPreLinks', () => {
    it('returns both "prefetch" and "preload" links for a given asset', () => {
      const asset = {
        chunk: 'foo',
        url: '/foo.js',
        type: 'childAsset',
        scriptType: 'script',
      };
      const chunkExtractor = createFakeChunkExtractor({
        getPreAssets: () => [asset],
      });

      const root = render({ chunkExtractor });

      expect(root.find('link[data-parent-chunk]')).toHaveLength(2);

      const preloadLink = root.find('link[data-parent-chunk]').at(0);
      expect(preloadLink).toHaveProp('as', asset.scriptType);
      expect(preloadLink).toHaveProp('data-parent-chunk', asset.chunk);
      expect(preloadLink).toHaveProp('href', asset.url);
      expect(preloadLink).toHaveProp('rel', 'preload');

      const prefetchLink = root.find('link[data-parent-chunk]').at(1);
      expect(prefetchLink).toHaveProp('as', asset.scriptType);
      expect(prefetchLink).toHaveProp('data-parent-chunk', asset.chunk);
      expect(prefetchLink).toHaveProp('href', asset.url);
      expect(prefetchLink).toHaveProp('rel', 'prefetch');
    });
  });

  describe('renderAsyncScripts()', () => {
    it('renders a "script" tag for the main "script" asset', () => {
      const asset = { chunk: 'foo', url: '/foo.js' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [asset],
      });

      const root = render({ chunkExtractor, includeSri: false });

      expect(root.find('link[data-chunk]')).toHaveLength(1);

      const link = root.find(`script[data-chunk="${asset.chunk}"]`);
      expect(link).toHaveProp('async', true);
      expect(link).toHaveProp('src', asset.url);
    });

    it('excludes the amo bundle', () => {
      const fooAsset = { chunk: 'foo', url: '/foo.js' };
      const mainAsset = { chunk: 'amo', url: '/main.js' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [fooAsset, mainAsset],
      });

      const root = render({ chunkExtractor, includeSri: false });

      expect(root.find('script[data-chunk]')).toHaveLength(1);
      expect(root.find(`script[data-chunk="${mainAsset.chunk}"]`)).toHaveLength(
        0,
      );
    });

    it('throws an error when SRI data are not found', () => {
      const asset = { chunk: 'foo', url: '/foo.js', filename: 'foo.js' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [asset],
      });
      const sriData = {
        ...fakeSRIData,
        [asset.filename]: undefined,
      };

      expect(() => {
        render({ chunkExtractor, includeSri: true, sriData });
      }).toThrow(`SRI Data is missing for "${asset.filename}"`);
    });

    it('adds SRI props when `includeSri` prop is set to `true`', () => {
      const asset = { chunk: 'foo', url: '/foo.js', filename: 'foo.js' };
      const chunkExtractor = createFakeChunkExtractor({
        getMainAssets: () => [asset],
      });
      const sriData = {
        ...fakeSRIData,
        [asset.filename]: 'sha512-something-something',
      };

      const root = render({ chunkExtractor, includeSri: true, sriData });

      const link = root.find(`script[data-chunk="${asset.chunk}"]`);
      expect(link).toHaveProp('crossOrigin', 'anonymous');
      expect(link).toHaveProp('integrity', sriData[asset.filename]);
    });
  });

  describe('code-splitting', () => {
    it('renders the required chunks script element', () => {
      const chunkExtractor = createFakeChunkExtractor();

      sinon.assert.notCalled(chunkExtractor.getRequiredChunksScriptElements);

      render({ chunkExtractor });

      sinon.assert.calledOnce(chunkExtractor.getRequiredChunksScriptElements);
    });
  });
});
