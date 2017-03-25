import Helmet from 'react-helmet';
import React, { PropTypes } from 'react';
import { findRenderedDOMComponentWithTag, renderIntoDocument } from 'react-addons-test-utils';

import ServerHtml from 'core/containers/ServerHtml';

describe('<ServerHtml />', () => {
  beforeEach(() => {
    Helmet.canUseDOM = false;
  });

  const fakeStore = {
    getState: () => ({ foo: 'bar' }),
  };

  const fakeAssets = {
    styles: {
      disco: '/bar/disco-blah.css',
      search: '/search-blah.css',
    },
    javascript: {
      disco: '/foo/disco-blah.js',
      search: '/search-blah.js',
    },
  };

  const fakeSRIData = {
    'disco-blah.css': 'sha512-disco-css',
    'search-blah.css': 'sha512-search-css',
    'disco-blah.js': 'sha512-disco-js',
    'search-blah.js': 'sha512-search-js',
  };

  class FakeApp extends React.Component {
    static propTypes = {
      children: PropTypes.node,
    }

    render() {
      const { children } = this.props;
      return (
        <div>
          <Helmet defaultTitle="test title">
            <meta name="description" content="test meta" />
          </Helmet>
          {children}
        </div>
      );
    }
  }

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
    return renderIntoDocument(<ServerHtml {...pageProps} />);
  }

  it('renders html attrs provided', () => {
    const html = findRenderedDOMComponentWithTag(
      render({ htmlLang: 'ar', htmlDir: 'rtl' }), 'html');
    assert.equal(html.getAttribute('lang'), 'ar');
    assert.equal(html.getAttribute('dir'), 'rtl');
  });

  it('renders GA script when trackingEnabled is true', () => {
    const html = findRenderedDOMComponentWithTag(
      render({ trackingEnabled: true }), 'html');
    const ga = html.querySelectorAll('script[src="https://www.google-analytics.com/analytics.js"]');
    assert.equal(ga.length, 1);
    assert.equal(ga[0].hasAttribute('async'), true);
  });

  it("doesn't render GA script when trackingEnabled is false", () => {
    const html = findRenderedDOMComponentWithTag(
      render({ trackingEnabled: false }), 'html');
    const ga = html.querySelectorAll('script[src="https://www.google-analytics.com/analytics.js"]');
    assert.equal(ga.length, 0);
  });

  it('renders css provided', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const styleSheets = html.querySelectorAll('link[rel="stylesheet"]');
    assert.equal(styleSheets.length, 1);
    const styleSheetLink = styleSheets[0];
    assert.equal(styleSheetLink.getAttribute('href'), '/bar/disco-blah.css');
  });

  it('renders js provided', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const js = html.querySelectorAll('script[src]');
    assert.equal(js.length, 1);
    const scriptNode = js[0];
    assert.equal(scriptNode.getAttribute('src'), '/foo/disco-blah.js');
  });

  it('renders css with SRI when present', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const styleSheet = html.querySelector('link[rel="stylesheet"]');
    assert.equal(styleSheet.getAttribute('integrity'), 'sha512-disco-css');
    assert.equal(styleSheet.getAttribute('crossorigin'), 'anonymous');
  });

  it('renders js with SRI when present', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const js = html.querySelector('script[src]');
    assert.equal(js.getAttribute('integrity'), 'sha512-disco-js');
    assert.equal(js.getAttribute('crossorigin'), 'anonymous');
  });

  it('renders state as JSON', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const json = html.querySelector('#redux-store-state').textContent;
    assert.equal(JSON.parse(json).foo, 'bar');
  });

  it('renders meta with utf8 charset ', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const meta = html.querySelector('meta[charset]');
    assert.equal(meta.getAttribute('charset'), 'utf-8');
  });

  it('renders favicon', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const favicon = html.querySelector('link[rel="shortcut icon"]');
    assert.equal(favicon.getAttribute('href'), '/favicon.ico');
  });

  it('renders title', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const title = html.querySelector('title').textContent;
    assert.equal(title, 'test title');
  });

  it('throws for unknown static type', () => {
    assert.throws(() => {
      const html = render({ includeSri: false });
      html.getStatic({ filePath: 'disco-foo', type: 'whatever' });
    }, Error, 'Unknown static type');
  });

  it('throws for missing SRI data', () => {
    assert.throws(() => {
      render({ sriData: {} });
    }, Error, /SRI Data is missing/);
  });

  it('does not render empty noscript styles', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const noScript = html.querySelector('noscript');
    assert.notOk(noScript);
  });

  it('renders noscript styles when provided', () => {
    const noScriptStyles = '.MyComponent { display: none; }';
    const html = findRenderedDOMComponentWithTag(render({ noScriptStyles }), 'html');
    const noScript = html.querySelector('noscript');
    assert.ok(noScript);
    assert.equal(noScript.children.length, 1);
    const style = noScript.children[0];
    assert.equal(style.tagName, 'STYLE');
    assert.equal(style.textContent, noScriptStyles);
  });
});
