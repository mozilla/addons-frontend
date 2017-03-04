/* global document */

import 'babel-polyfill';
import config from 'config';
import RavenJs from 'raven-js';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { applyRouterMiddleware, Router, browserHistory } from 'react-router';
import { ReduxAsyncConnect } from 'redux-connect';
import useScroll from 'react-router-scroll/lib/useScroll';

import { langToLocale, makeI18n, sanitizeLanguage } from 'core/i18n/utils';
import I18nProvider from 'core/i18n/Provider';
import log from 'core/logger';


export default function makeClient(routes, createStore) {
  const publicSentryDsn = config.get('publicSentryDsn');
  if (publicSentryDsn) {
    log.info(`Configured client-side Sentry with DSN ${publicSentryDsn}`);
    RavenJs.config(publicSentryDsn).install();
  } else {
    log.warn('Client-side Sentry reporting was disabled by the config');
  }

  const initialStateContainer = document.getElementById('redux-store-state');
  let initialState;

  const html = document.querySelector('html');
  const lang = sanitizeLanguage(html.getAttribute('lang'));
  const locale = langToLocale(lang);
  const appName = config.get('appName');

  function renderApp(i18nData) {
    const i18n = makeI18n(i18nData, lang);

    if (initialStateContainer) {
      try {
        initialState = JSON.parse(initialStateContainer.textContent);
      } catch (error) {
        log.error('Could not load initial redux data');
      }
    }
    const store = createStore(initialState);

    // wrapper to make redux-connect applyRouterMiddleware compatible see
    // https://github.com/taion/react-router-scroll/issues/3
    const useReduxAsyncConnect = () => ({
      renderRouterContext: (child, props) => (
        <ReduxAsyncConnect {...props}>{child}</ReduxAsyncConnect>
      ),
    });

    const middleware = applyRouterMiddleware(
      useScroll(),
      useReduxAsyncConnect(),
    );

    render(
      <I18nProvider i18n={i18n}>
        <Provider store={store} key="provider">
          <Router render={middleware} history={browserHistory}>
            {routes}
          </Router>
        </Provider>
      </I18nProvider>,
      document.getElementById('react-view')
    );
  }


  try {
    if (locale !== langToLocale(config.get('defaultLang'))) {
      // eslint-disable-next-line max-len, global-require, import/no-dynamic-require
      require(`bundle?name=[name]-i18n-[folder]!../../locale/${locale}/${appName}.js`)(renderApp);
    } else {
      renderApp({});
    }
  } catch (e) {
    log.info(dedent`Locale not found or required for locale: "${locale}".
      Falling back to default lang: "${config.get('defaultLang')}"`);
    renderApp({});
  }
}
