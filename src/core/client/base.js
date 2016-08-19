import 'babel-polyfill';
import config from 'config';
import Jed from 'jed';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { ReduxAsyncConnect } from 'redux-async-connect';

import { langToLocale, sanitizeLanguage } from 'core/i18n/utils';
import I18nProvider from 'core/i18n/Provider';
import log from 'core/logger';


export default function makeClient(routes, createStore) {
  const initialStateContainer = document.getElementById('redux-store-state');
  let initialState;

  const html = document.querySelector('html');
  const lang = sanitizeLanguage(html.getAttribute('lang'));
  const locale = langToLocale(lang);
  const appName = config.get('appName');

  function renderApp(jedData) {
    const i18n = new Jed(jedData);

    if (initialStateContainer) {
      try {
        initialState = JSON.parse(initialStateContainer.textContent);
      } catch (error) {
        log.error('Could not load initial redux data');
      }
    }
    const store = createStore(initialState);

    function reduxAsyncConnectRender(props) {
      return <ReduxAsyncConnect {...props} />;
    }

    render(
      <I18nProvider i18n={i18n}>
        <Provider store={store} key="provider">
          <Router render={reduxAsyncConnectRender} children={routes} history={browserHistory} />
        </Provider>
      </I18nProvider>,
      document.getElementById('react-view')
    );
  }


  try {
    if (locale !== langToLocale(config.get('defaultLang'))) {
      // eslint-disable-next-line max-len, global-require
      require(`bundle?name=[name]-i18n-[folder]!json!../../locale/${locale}/${appName}.json`)(renderApp);
    } else {
      renderApp({});
    }
  } catch (e) {
    log.info(dedent`Locale not found or required for locale: "${locale}".
      Falling back to default lang: "${config.get('defaultLang')}"`);
    renderApp({});
  }
}
