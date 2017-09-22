import { loadingBarReducer } from 'react-redux-loading-bar';
import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';
import createSagaMiddleware from 'redux-saga';

import addonsByAuthors from 'amo/reducers/addonsByAuthors';
import featured from 'amo/reducers/featured';
import landing from 'amo/reducers/landing';
import reviews from 'amo/reducers/reviews';
import viewContext from 'amo/reducers/viewContext';
import abuse from 'core/reducers/abuse';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import autocomplete from 'core/reducers/autocomplete';
import categories from 'core/reducers/categories';
import errors from 'core/reducers/errors';
import errorPage from 'core/reducers/errorPage';
import infoDialog from 'core/reducers/infoDialog';
import installations from 'core/reducers/installations';
import search from 'core/reducers/search';
import user from 'core/reducers/user';
import { middleware } from 'core/store';


export default function createStore(initialState = {}) {
  const sagaMiddleware = createSagaMiddleware();

  const store = _createStore(
    combineReducers({
      abuse,
      addons,
      addonsByAuthors,
      api,
      autocomplete,
      categories,
      errors,
      errorPage,
      featured,
      infoDialog,
      installations,
      landing,
      loadingBar: loadingBarReducer,
      reduxAsyncConnect,
      reviews,
      search,
      user,
      viewContext,
    }),
    initialState,
    middleware({ sagaMiddleware }),
  );

  return { sagaMiddleware, store };
}
