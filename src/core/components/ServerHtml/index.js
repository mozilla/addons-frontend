/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom/server';
import serialize from 'serialize-javascript';
import { Helmet } from 'react-helmet';
import config from 'config';

import { APP_NAME, LTR } from 'core/constants';

const JS_CHUNK_EXCLUDES = new RegExp(
  `(?:${config.get('jsChunkExclusions').join('|')})`,
);

export default class ServerHtml extends Component {
  static propTypes = {
    appState: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    chunkExtractor: PropTypes.object.isRequired,
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

    // Only output files for the current app.
    if (leafName.startsWith(APP_NAME) && !JS_CHUNK_EXCLUDES.test(leafName)) {
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

  renderStyles() {
    const { chunkExtractor } = this.props;

    return chunkExtractor
      .getMainAssets('style')
      .filter(
        // We render the main bundle with `getScript()`, so we skip it here.
        (asset) => asset.chunk !== APP_NAME,
      )
      .map((asset) => {
        const sriProps = this.getSriProps(asset.filename);

        return (
          <link
            data-chunk={asset.chunk}
            href={asset.url}
            key={asset.url}
            rel="stylesheet"
            type="text/css"
            {...sriProps}
          />
        );
      });
  }

  renderPreLinks() {
    const { chunkExtractor } = this.props;

    return (
      chunkExtractor
        .getPreAssets()
        // We want to retrieve the bundles with "webpackPreload: true" only, and
        // not the main bundle (amo).
        .filter((asset) => asset.type === 'childAsset')
        // We return both "preload" and "prefetch" links to maximize browser
        // support, even though both links don't have the same goal.
        .map((asset) => [
          <link
            as={asset.scriptType}
            data-parent-chunk={asset.chunk}
            href={asset.url}
            key={`preload-${asset.url}`}
            rel="preload"
          />,
          <link
            as={asset.scriptType}
            data-parent-chunk={asset.chunk}
            href={asset.url}
            key={`prefetch-${asset.url}`}
            rel="prefetch"
          />,
        ])
    );
  }

  renderAsyncScripts() {
    const { chunkExtractor } = this.props;

    return chunkExtractor
      .getMainAssets('script')
      .filter(
        // We render the main bundle with `getScript()`, so we skip it here.
        (asset) => asset.chunk !== APP_NAME,
      )
      .map((asset) => {
        const sriProps = this.getSriProps(asset.filename);

        return (
          <script
            async
            data-chunk={asset.chunk}
            key={asset.url}
            src={asset.url}
            {...sriProps}
          />
        );
      });
  }

  render() {
    const {
      appState,
      chunkExtractor,
      component,
      htmlDir,
      htmlLang,
    } = this.props;

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
          {head.meta.toComponent()}

          <link rel="shortcut icon" href={this.getFaviconLink()} />
          {head.link.toComponent()}
          {this.renderPreLinks()}

          {this.getStyle()}
          {this.renderStyles()}

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
          {chunkExtractor.getRequiredChunksScriptElements()}

          {this.getAnalytics()}
          {this.getScript()}
          {this.renderAsyncScripts()}
        </body>
      </html>
    );
  }
}
