import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { ReduxAsyncConnect } from 'redux-async-connect';
import routes from './routes';
import createStore from './store';

const store = createStore(window.__data);

function reduxAsyncConnectRender(props) {
  return <ReduxAsyncConnect {...props} />;
}

render(
  <Provider store={store} key="provider">
    <Router render={reduxAsyncConnectRender} children={routes} history={browserHistory} />
  </Provider>,
  document.getElementById('react-view')
);
