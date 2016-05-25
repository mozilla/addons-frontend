import 'babel-polyfill';
import React from 'react';

import config from 'config';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { ReduxAsyncConnect } from 'redux-async-connect';
import { langToLocale, getLanguage } from 'core/i18n/utils';
import I18nProvider from 'core/i18n/Provider';
import Jed from 'jed';

import log from 'core/logger';


export default function makeClient(routes, createStore) {
  const initialStateContainer = document.getElementById('redux-store-state');
  let initialState;

  const html = document.querySelector('html');
  const lang = getLanguage(html.getAttribute('lang'));
  const locale = langToLocale(lang);
  const appName = config.get('appName');
  // eslint-disable-next-line global-require
  const jedData = require(`json!../../locale/${locale}/${appName}.json`);
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
