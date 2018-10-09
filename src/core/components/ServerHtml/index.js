/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom/server';
import serialize from 'serialize-javascript';
import Helmet from 'react-helmet';
import config from 'config';

import { LTR } from 'core/constants';

const JS_CHUNK_EXCLUDES = new RegExp(
  `(?:${config.get('jsChunkExclusions').join('|')})`,
);

export default class ServerHtml extends Component {
  static propTypes = {
    appName: PropTypes.string.isRequired,
    assets: PropTypes.object.isRequired,
    component: PropTypes.element.isRequired,
    htmlDir: PropTypes.string,
    htmlLang: PropTypes.string,
    includeSri: PropTypes.bool.isRequired,
    noScriptStyles: PropTypes.string,
    sriData: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    trackingEnabled: PropTypes.bool,
    _config: PropTypes.object,
  };

  static defaultProps = {
    htmlDir: LTR,
    htmlLang: 'en-US',
    trackingEnabled: false,
    _config: config,
  };

  getStatic({ filePath, type, index }) {
    const { includeSri, sriData, appName } = this.props;
    const leafName = filePath.split('/').pop();
    let sriProps = {};
    // Only output files for the current app.
    if (leafName.startsWith(appName) && !JS_CHUNK_EXCLUDES.test(leafName)) {
      if (includeSri) {
        sriProps = {
          integrity: sriData[leafName],
          crossOrigin: 'anonymous',
        };
        if (!sriProps.integrity) {
          throw new Error(`SRI Data is missing for ${leafName}`);
        }
      }
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

  render() {
    const { component, htmlLang, htmlDir, noScriptStyles, store } = this.props;

    // This must happen before Helmet.rewind() see
    // https://github.com/nfl/react-helmet#server-usage for more info.
    const content = component ? ReactDOM.renderToString(component) : '';
    const head = Helmet.rewind();

    return (
      <html lang={htmlLang} dir={htmlDir}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="shortcut icon" href={this.getFaviconLink()} />
          {head.link.toComponent()}
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {this.getStyle()}
          {noScriptStyles ? (
            <noscript>
              <style dangerouslySetInnerHTML={{ __html: noScriptStyles }} />
            </noscript>
          ) : null}
        </head>
        <body>
          <div id="react-view" dangerouslySetInnerHTML={{ __html: content }} />
          <script
            dangerouslySetInnerHTML={{ __html: serialize(store.getState()) }}
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
