/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom/server';
import serialize from 'serialize-javascript';
import { Helmet } from 'react-helmet';
import config from 'config';

import { LTR } from 'amo/constants';

const JS_CHUNK_EXCLUDES = new RegExp(
  `(?:${config.get('jsChunkExclusions').join('|')})`,
);

function getSriProps(assetName, includeSri, sriData) {
  let sriProps = {};
  if (!includeSri) {
    return sriProps;
  }

  sriProps = {
    integrity: sriData[assetName],
    crossOrigin: 'anonymous',
  };

  if (!sriProps.integrity) {
    throw new Error(`SRI Data is missing for "${assetName}"`);
  }

  return sriProps;
}

export function getStatic({ filePath, type, index, includeSri, sriData }) {
  const leafName = filePath.split('/').pop();

  if (!JS_CHUNK_EXCLUDES.test(leafName)) {
    switch (type) {
      case 'css':
        return (
          <link
            href={filePath}
            {...getSriProps(leafName, includeSri, sriData)}
            key={type + index}
            rel="stylesheet"
            type="text/css"
          />
        );
      case 'js':
        return (
          <script
            key={type + index}
            src={filePath}
            {...getSriProps(leafName, includeSri, sriData)}
          />
        );
      case 'font':
        return (
          <link
            href={filePath}
            // We don't generate integrity data for fonts, so avoid calling
            // getSriProps() - it would fail.
            crossOrigin="anonymous"
            key={type + index}
            rel="preload"
            as="font"
            type="font/woff2"
          />
        );
      default:
        throw new Error('Unknown static type');
    }
  } else {
    return null;
  }
}

export default class ServerHtml extends Component {
  static propTypes = {
    initialI18nStore: PropTypes.object.isRequired,
    appState: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    component: PropTypes.element.isRequired,
    htmlDir: PropTypes.string,
    htmlLang: PropTypes.string,
    includeSri: PropTypes.bool.isRequired,
    sriData: PropTypes.object.isRequired,
    trackingEnabled: PropTypes.bool,
    _config: PropTypes.object,
  };

  static defaultProps = {
    htmlDir: LTR,
    htmlLang: 'en-US',
    trackingEnabled: false,
    _config: config,
  };

  getAnalytics() {
    const { _config } = this.props;
    if (this.props.trackingEnabled) {
      return (
        <>
          <script async src="https://www.google-analytics.com/analytics.js" />
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${_config.get(
              'ga4PropertyId',
            )}`}
          />
        </>
      );
    }
    return null;
  }

  getStyle() {
    const { assets, includeSri, sriData } = this.props;
    return Object.keys(assets.styles).map((style, index) =>
      getStatic({
        filePath: assets.styles[style],
        type: 'css',
        index,
        includeSri,
        sriData,
      }),
    );
  }

  getScript() {
    const { assets, includeSri, sriData } = this.props;
    return Object.keys(assets.javascript).map((js, index) =>
      getStatic({
        filePath: assets.javascript[js],
        type: 'js',
        index,
        includeSri,
        sriData,
      }),
    );
  }

  getFaviconLink() {
    const { _config } = this.props;
    // /favicon.ico is an alias handled in nginx - the favicon is actually in
    // addons-server static files.
    return `/favicon.ico?v=${_config.get('faviconVersion')}`;
  }

  getFontPreload() {
    const { assets, includeSri, sriData } = this.props;
    // Preload variable font(s) with `subset` in their name.
    // Note the .* after '.var': this is for the contenthash that is added in
    // production builds.
    const subsetFontPattern = /-subset-.*\.var.*\.woff2$/i;

    return Object.keys(assets.assets)
      .filter((asset) => subsetFontPattern.test(asset))
      .map((asset, index) =>
        getStatic({
          filePath: assets.assets[asset],
          type: 'font',
          index,
          includeSri,
          sriData,
        }),
      );
  }

  render() {
    const { appState, component, htmlDir, htmlLang, initialI18nStore } =
      this.props;

    // This must happen before Helmet.rewind() see
    // https://github.com/nfl/react-helmet#server-usage for more info.
    const content = component ? ReactDOM.renderToString(component) : '';
    const head = Helmet.rewind();

    return (
      <html lang={htmlLang} dir={htmlDir}>
        <head>
          {head.title.toComponent()}

          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          {/* Keep stylesheets high to make sure there are in the first TCP packet sent */}
          {this.getFontPreload()}
          {this.getStyle()}

          {head.meta.toComponent()}

          <link rel="shortcut icon" href={this.getFaviconLink()} />
          {head.link.toComponent()}

          {head.script.toComponent()}
        </head>
        <body>
          <div id="react-view" dangerouslySetInnerHTML={{ __html: content }} />

          <script
            dangerouslySetInnerHTML={{
              __html: serialize(appState, { isJSON: true }),
            }}
            type="application/json"
            id="redux-store-state"
          />

          <script
            dangerouslySetInnerHTML={{
              __html: serialize(initialI18nStore, { isJSON: true }),
            }}
            type="application/json"
            id="initial-i18next-store"
          />

          {this.getAnalytics()}
          {this.getScript()}
        </body>
      </html>
    );
  }
}
