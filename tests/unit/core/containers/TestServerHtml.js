import Helmet from 'react-helmet';
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedDOMComponentWithTag,
  renderIntoDocument,
} from 'react-dom/test-utils';

import ServerHtml from 'core/containers/ServerHtml';
import FakeApp, {
  fakeAssets, fakeSRIData,
} from 'tests/unit/core/server/fakeApp';
import { getFakeConfig } from 'tests/unit/helpers';

describe('<ServerHtml />', () => {
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
    return renderIntoDocument(<ServerHtml {...pageProps} />);
  }

  it('renders html attrs provided', () => {
    const html = findRenderedDOMComponentWithTag(
      render({ htmlLang: 'ar', htmlDir: 'rtl' }), 'html');
    expect(html.getAttribute('lang')).toEqual('ar');
    expect(html.getAttribute('dir')).toEqual('rtl');
  });

  it('renders meta attrs inside helmet', () => {
    const meta = findDOMNode(render()).querySelector('meta[name=description]');
    expect(meta.content).toEqual('test meta');
    expect(meta.name).toEqual('description');
  });

  it('renders GA script when trackingEnabled is true', () => {
    const html = findRenderedDOMComponentWithTag(
      render({ trackingEnabled: true }), 'html');
    const ga = html.querySelectorAll('script[src="https://www.google-analytics.com/analytics.js"]');
    expect(ga.length).toEqual(1);
    expect(ga[0].hasAttribute('async')).toEqual(true);
  });

  it("doesn't render GA script when trackingEnabled is false", () => {
    const html = findRenderedDOMComponentWithTag(
      render({ trackingEnabled: false }), 'html');
    const ga = html.querySelectorAll('script[src="https://www.google-analytics.com/analytics.js"]');
    expect(ga.length).toEqual(0);
  });

  it('renders css provided', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const styleSheets = html.querySelectorAll('link[rel="stylesheet"]');
    expect(styleSheets.length).toEqual(1);
    const styleSheetLink = styleSheets[0];
    expect(styleSheetLink.getAttribute('href')).toEqual('/bar/disco-blah.css');
  });

  it('renders js provided', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const js = html.querySelectorAll('script[src]');
    expect(js.length).toEqual(1);
    const scriptNode = js[0];
    expect(scriptNode.getAttribute('src')).toEqual('/foo/disco-blah.js');
  });

  it('renders css with SRI when present', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const styleSheet = html.querySelector('link[rel="stylesheet"]');
    expect(styleSheet.getAttribute('integrity')).toEqual('sha512-disco-css');
    expect(styleSheet.getAttribute('crossorigin')).toEqual('anonymous');
  });

  it('renders js with SRI when present', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const js = html.querySelector('script[src]');
    expect(js.getAttribute('integrity')).toEqual('sha512-disco-js');
    expect(js.getAttribute('crossorigin')).toEqual('anonymous');
  });

  it('renders state as JSON', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const json = html.querySelector('#redux-store-state').textContent;
    expect(JSON.parse(json).foo).toEqual('bar');
  });

  it('renders meta with utf8 charset ', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const meta = html.querySelector('meta[charset]');
    expect(meta.getAttribute('charset')).toEqual('utf-8');
  });

  it('renders favicon', () => {
    const amoCDN = 'https://test.cdn.net';
    const _config = getFakeConfig({ amoCDN });
    const html = findRenderedDOMComponentWithTag(render({ _config }), 'html');
    const favicon = html.querySelector('link[rel="shortcut icon"]');
    expect(favicon.getAttribute('href')).toEqual(`${amoCDN}/favicon.ico?v=2`);
  });

  it('renders title', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const title = html.querySelector('title').textContent;
    expect(title).toEqual('test title');
  });

  it('throws for unknown static type', () => {
    expect(() => {
      const html = render({ includeSri: false });
      html.getStatic({ filePath: 'disco-foo', type: 'whatever' });
    }).toThrowError('Unknown static type');
  });

  it('throws for missing SRI data', () => {
    expect(() => {
      render({ sriData: {} });
    }).toThrowError(/SRI Data is missing/);
  });

  it('does not render empty noscript styles', () => {
    const html = findRenderedDOMComponentWithTag(render(), 'html');
    const noScript = html.querySelector('noscript');
    expect(noScript).toBeFalsy();
  });

  it('renders noscript styles when provided', () => {
    const noScriptStyles = '.MyComponent { display: none; }';
    const html = findRenderedDOMComponentWithTag(render({ noScriptStyles }), 'html');
    const noScript = html.querySelector('noscript');
    expect(noScript).toBeTruthy();
    expect(noScript.children.length).toEqual(1);
    const style = noScript.children[0];
    expect(style.tagName).toEqual('STYLE');
    expect(style.textContent).toEqual(noScriptStyles);
  });
});
