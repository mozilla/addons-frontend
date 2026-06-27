/* global window */
import 'amo/polyfill';
import { oneLine } from 'common-tags';
import config from 'config';
import { createBrowserHistory } from 'history';
import * as React from 'react';
import { createRoot } from 'react-dom';

import Root from 'amo/components/Root';
import {
  THEME_AUTO,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
} from 'amo/constants';
import { langToLocale, makeI18n, sanitizeLanguage } from 'amo/i18n/utils';
import log from 'amo/logger';
import { setTheme } from 'amo/reducers/theme';
import { addQueryParamsToHistory } from 'amo/utils';

export default async function createClient(
  createStore,
  {
    _config = config,
    _createBrowserHistory = createBrowserHistory,
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

  const initialStateContainer = document.querySelector(
    'script[id="redux-store-state"]',
  );
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

  const { connectedHistory, sagaMiddleware, store } = createStore({
    history,
    initialState,
  });

  if (sagas && sagaMiddleware) {
    sagaMiddleware.run(sagas);
  } else {
    log.warn(`sagas not found`);
  }

  // Re-apply the saved color theme preference. It lives in localStorage which
  // means we can only read it here on the client. We set <html data-theme> as
  // early as possible to minimise the flash for users who forced a theme that
  // differs from their OS preference; users on "auto" are handled entirely in
  // CSS via `prefers-color-scheme` with no flash. See amo/css/theme.scss.
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (THEME_PREFERENCES.includes(savedTheme) && savedTheme !== THEME_AUTO) {
      store.dispatch(setTheme(savedTheme));
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (error) {
    log.warn(`Could not read theme preference: ${error}`);
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
  const i18n = makeI18n(i18nData, lang);

  const renderApp = (App) => {
    const root = createRoot(document.getElementById('react-view'));
    root.render(
      <Root history={connectedHistory} i18n={i18n} store={store}>
        <App />
      </Root>,
    );
  };

  return { connectedHistory, renderApp, store };
}
