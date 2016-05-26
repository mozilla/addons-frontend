import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom/server';
import serialize from 'serialize-javascript';
import Helmet from 'react-helmet';


export default class ServerHtml extends Component {

  static propTypes = {
    appName: PropTypes.string.isRequired,
    assets: PropTypes.object.isRequired,
    component: PropTypes.object.isRequired,
    htmlDir: PropTypes.object,
    htmlLang: PropTypes.object,
    includeSri: PropTypes.bool,
    sriData: PropTypes.object,
    store: PropTypes.object.isRequired,
  };

  static defaultProps = {
    htmlDir: 'ltr',
    htmlLang: 'en-US',
  }

  getStatic({filePath, type, index}) {
    const { includeSri, sriData, appName } = this.props;
    const leafName = filePath.split('/').pop();
    let sriProps = {};
    // Only output files for the current app.
    if (leafName.startsWith(appName) && !leafName.includes('i18n')) {
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
          return (<link href={filePath} {...sriProps}
                        key={type + index}
                        rel="stylesheet" type="text/css" />);
        case 'js':
          return <script key={type + index} src={filePath} {...sriProps}></script>;
        default:
          throw new Error('Unknown static type');
      }
    } else {
      return null;
    }
  }

  getStyle() {
    const { assets } = this.props;
    return Object.keys(assets.styles).map((style, index) =>
      this.getStatic({filePath: assets.styles[style], type: 'css', index}));
  }

  getScript() {
    const { assets } = this.props;
    return Object.keys(assets.javascript).map((js, index) =>
      this.getStatic({filePath: assets.javascript[js], type: 'js', index}));
  }

  render() {
    const { component, htmlLang, htmlDir, store } = this.props;
    // This must happen before Helmet.rewind() see
    // https://github.com/nfl/react-helmet#server-usage for more info.
    const content = component ? ReactDOM.renderToString(component) : '';
    const head = Helmet.rewind();

    return (
      <html lang={htmlLang} dir={htmlDir}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="shortcut icon" href="/favicon.ico" />
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {this.getStyle()}
        </head>
        <body>
          <div id="react-view" dangerouslySetInnerHTML={{__html: content}} />
          <script dangerouslySetInnerHTML={{__html: serialize(store.getState())}}
                  type="application/json" id="redux-store-state" />
          {this.getScript()}
        </body>
      </html>
    );
  }
}
