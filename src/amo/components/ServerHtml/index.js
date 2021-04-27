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

export default class ServerHtml extends Component {
  static propTypes = {
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

  getSriProps(assetName) {
    const { includeSri, sriData } = this.props;

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

  getStatic({ filePath, type, index }) {
    const leafName = filePath.split('/').pop();

    if (!JS_CHUNK_EXCLUDES.test(leafName)) {
      const sriProps = this.getSriProps(leafName);

      switch (type) {
        case 'css':
          return (
            <link
              href={filePath}
              {...sriProps}
              key={type + index}
              rel="stylesheet"
              type="text/css"
            />
          );
        case 'js':
          return <script key={type + index} src={filePath} {...sriProps} />;
        case 'font':
          // Always apply crossorigin for the font, even when we don't have
          // SRI data.
          sriProps.crossOrigin = 'anonymous';
          return (
            <link
              href={filePath}
              {...sriProps}
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

  getAnalytics() {
    if (this.props.trackingEnabled) {
      return (
        <script async src="https://www.google-analytics.com/analytics.js" />
      );
    }
    return null;
  }

  getStyle() {
    const { assets } = this.props;
    return Object.keys(assets.styles).map((style, index) =>
      this.getStatic({ filePath: assets.styles[style], type: 'css', index }),
    );
  }

  getScript() {
    const { assets } = this.props;
    return Object.keys(assets.javascript).map((js, index) =>
      this.getStatic({ filePath: assets.javascript[js], type: 'js', index }),
    );
  }

  getFaviconLink() {
    const { _config } = this.props;
    return `${_config.get('amoCDN')}/favicon.ico?v=${_config.get(
      'faviconVersion',
    )}`;
  }

  getFontPreload() {
    const { assets, htmlLang } = this.props;
    // Preload relevant minimal subset font if available for this language.
    const extractSubset = /subset-([\w\-+]+)\.var\.woff2/;

    return Object.keys(assets.assets)
      .filter((asset) => {
        const found = extractSubset.exec(asset);
        return found && found.length === 2 && found[1].includes(htmlLang);
      })
      .map((asset, index) =>
        this.getStatic({
          filePath: assets.assets[asset],
          type: 'font',
          index,
        }),
      );
  }

  render() {
    const { appState, component, htmlDir, htmlLang } = this.props;

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
          {this.getStyle()}
          {this.getFontPreload()}

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

          {this.getAnalytics()}
          {this.getScript()}
        </body>
      </html>
    );
  }
}
