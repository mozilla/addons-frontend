/* global document */

import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { applyRouterMiddleware, Router, browserHistory } from 'react-router';
import { ReduxAsyncConnect } from 'redux-connect';
import useScroll from 'react-router-scroll/lib/useScroll';

import log from 'core/logger';


export default function makeClient(routes, createStore) {
  const initialStateContainer = document.getElementById('redux-store-state');
  let initialState;

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
    <Provider store={store} key="provider">
      <Router render={middleware} history={browserHistory}>
        {routes}
      </Router>
    </Provider>,
    document.getElementById('react-view')
  );
}
