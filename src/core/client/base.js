/* global DEPLOYMENT_VERSION */
import 'core/polyfill';
import { oneLine } from 'common-tags';
import config from 'config';
import FastClick from 'fastclick';
import { createBrowserHistory } from 'history';
import RavenJs from 'raven-js';
import * as React from 'react';
import { render } from 'react-dom';
import { loadableReady } from '@loadable/component';

import Root from 'core/components/Root';
import { APP_NAME } from 'core/constants';
import { langToLocale, makeI18n, sanitizeLanguage } from 'core/i18n/utils';
import log from 'core/logger';
import { addQueryParamsToHistory } from 'core/utils';
import { getSentryRelease } from 'core/utils/sentry';
import tracking from 'core/tracking';

export default async function createClient(
  createStore,
  {
    _FastClick = FastClick,
    _RavenJs = RavenJs,
    _config = config,
    _createBrowserHistory = createBrowserHistory,
    _tracking = tracking,
    sagas = null,
  } = {},
) {
  if (_config.get('isDevelopment')) {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { fetchBufferedLogs } = require('pino-devtools/src/client');
    await fetchBufferedLogs();
  }

  // This code needs to come before anything else so we get logs/errors if
  // anything else in this function goes wrong.
  const publicSentryDsn = _config.get('publicSentryDsn');
  const sentryIsEnabled = Boolean(publicSentryDsn);
  if (sentryIsEnabled) {
    log.info(`Configured client-side Sentry with DSN ${publicSentryDsn}`);
    _RavenJs
      .config(publicSentryDsn, {
        logger: 'client-js',
        // `DEPLOYMENT_VERSION` is injected by webpack at build time (thanks to
        // the `DefinePlugin`).
        // See: https://github.com/mozilla/addons-frontend/issues/8270
        release: getSentryRelease({ version: DEPLOYMENT_VERSION }),
      })
      .install();
  } else {
    log.warn('Client-side Sentry reporting was disabled by the config');
  }

  if (config.get('enableStrictMode')) {
    log.info(oneLine`StrictMode is enabled, which causes double redux action
      dispatching. See: https://github.com/mozilla/addons-frontend/issues/6424`);
  }

  _FastClick.attach(document.body);

  const initialStateContainer = document.getElementById('redux-store-state');
  let initialState;

  const html = document.querySelector('html');
  const lang = sanitizeLanguage(html.getAttribute('lang'));
  const locale = langToLocale(lang);

  if (initialStateContainer) {
    try {
      initialState = JSON.parse(initialStateContainer.textContent);
    } catch (error) {
      log.error('Could not load initial redux data');
    }
  }

  const history = addQueryParamsToHistory({
    history: _createBrowserHistory({
      // When `forceRefresh` is `true`, client side navigation is disabled and
      // all links will trigger a full page reload. This is what we want when
      // the server has loaded an anoynmous page.
      forceRefresh:
        initialState && initialState.site
          ? initialState.site.loadedPageIsAnonymous
          : false,
    }),
  });

  // See: https://github.com/mozilla/addons-frontend/issues/8647
  history.listen((location) => {
    _tracking.setPage(location.pathname);
    // It is guaranteed that the navigation has happened but the title of the
    // page is likely stale, so we are omitting it.
    _tracking.pageView({ title: '' });
  });

  const { sagaMiddleware, store } = createStore({ history, initialState });

  if (sentryIsEnabled) {
    _RavenJs.setTagsContext({ amo_request_id: store.getState().api.requestId });
  }

  if (sagas && sagaMiddleware) {
    sagaMiddleware.run(sagas);
  } else {
    log.warn(`sagas not found`);
  }

  let i18nData = {};
  try {
    if (locale !== langToLocale(_config.get('defaultLang'))) {
      i18nData = await new Promise((resolve) => {
        // eslint-disable-next-line max-len, global-require, import/no-dynamic-require
        require(`bundle-loader?name=[name]-i18n-[folder]!../../locale/${locale}/${APP_NAME}.js`)(
          resolve,
        );
      });
    }
  } catch (e) {
    log.info(oneLine`Locale not found or required for locale: "${locale}".
      Falling back to default lang: "${_config.get('defaultLang')}"`);
  }
  const i18n = makeI18n(i18nData, lang);

  const renderApp = (App) => {
    return loadableReady(() => {
      render(
        <Root history={history} i18n={i18n} store={store}>
          <App />
        </Root>,
        document.getElementById('react-view'),
      );
    });
  };

  return { history, renderApp, store };
}
