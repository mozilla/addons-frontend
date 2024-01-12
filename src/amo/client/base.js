import 'amo/polyfill';
import { oneLine } from 'common-tags';
import config from 'config';
import { createBrowserHistory } from 'history';
import * as React from 'react';
import { createRoot } from 'react-dom';

import Root from 'amo/components/Root';
import { langToLocale, makeI18n, sanitizeLanguage } from 'amo/i18n/utils';
import log from 'amo/logger';
import { addQueryParamsToHistory } from 'amo/utils';
import tracking from 'amo/tracking';
import { init as initI18next } from 'amo/i18next';

export default async function createClient(
  createStore,
  {
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

  if (config.get('enableStrictMode')) {
    log.info(oneLine`StrictMode is enabled, which causes double redux action
      dispatching. See: https://github.com/mozilla/addons-frontend/issues/6424`);
  }

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

  const { connectedHistory, sagaMiddleware, store } = createStore({
    history,
    initialState,
  });

  if (sagas && sagaMiddleware) {
    sagaMiddleware.run(sagas);
  } else {
    log.warn(`sagas not found`);
  }

  let i18nData = {};
  try {
    if (locale !== langToLocale(_config.get('defaultLang'))) {
      i18nData = await import(
        /* webpackChunkName: "amo-i18n-[request]" */
        `../../locale/${locale}/amo.js`
      );
    }
  } catch (e) {
    log.info(oneLine`Locale not found or required for locale: "${locale}".
      Falling back to default lang: "${_config.get('defaultLang')}"`);
  }
  const jed = makeI18n(i18nData, lang);
  const instance = await initI18next(locale, _config.get('defaultLang'));

  const renderApp = (App) => {
    const root = createRoot(document.getElementById('react-view'));
    root.render(
      <Root
        history={connectedHistory}
        jed={jed}
        i18next={instance}
        store={store}
      >
        <App />
      </Root>,
    );
  };

  return { connectedHistory, renderApp, store };
}
