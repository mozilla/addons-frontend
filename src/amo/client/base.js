import 'amo/polyfill';
import { oneLine } from 'common-tags';
import config from 'config';
import { createBrowserHistory } from 'history';
import * as React from 'react';
import { createRoot } from 'react-dom';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

import Root from 'amo/components/Root';
import { langToLocale, sanitizeLanguage } from 'amo/i18n/utils';
import log from 'amo/logger';
import { addQueryParamsToHistory } from 'amo/utils';
import tracking from 'amo/tracking';

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

  // initialize i18next
  await i18next
    .use(initReactI18next)
    .use(Backend)
    .init({
      debug: true,
      fallbackLng: 'en_US',
      fallbackNS: 'amo',
      ns: 'amo',
      lng: locale,
      react: { useSuspense: false },
      backend: { loadPath: '/locale/{{lng}}/{{ns}}.json' },
      detection: {
        order: ['htmlTag'],
        caches: [],
      },
    });

  if (typeof window !== 'undefined') {
    window.i18next = i18next;
  }
  const renderApp = (App) => {
    const root = createRoot(document.getElementById('react-view'));
    root.render(
      <Root history={connectedHistory} i18n={i18next} store={store}>
        <App />
      </Root>,
    );
  };

  return { connectedHistory, renderApp, store };
}
