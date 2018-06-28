import { createStore as _createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { browserHistory } from 'react-router';
import { routerMiddleware, routerReducer as routing } from 'react-router-redux';

import { middleware } from 'core/store';
import addons from 'core/reducers/addons';
import errors from 'core/reducers/errors';
import api from 'core/reducers/api';
import errorPage from 'core/reducers/errorPage';
import infoDialog from 'core/reducers/infoDialog';
import installations from 'core/reducers/installations';
import discoResults from 'disco/reducers/discoResults';
import redirectTo from 'core/reducers/redirectTo';
import uiState from 'core/reducers/uiState';

export default function createStore({
  history = browserHistory,
  initialState = {},
} = {}) {
  const sagaMiddleware = createSagaMiddleware();
  const store = _createStore(
    combineReducers({
      addons,
      api,
      errors,
      discoResults,
      errorPage,
      installations,
      infoDialog,
      redirectTo,
      routing,
      uiState,
    }),
    initialState,
    middleware({
      routerMiddleware: routerMiddleware(history),
      sagaMiddleware,
    }),
  );

  return { sagaMiddleware, store };
}
