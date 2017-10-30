import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';
import createSagaMiddleware from 'redux-saga';

import addonsByAuthors from 'amo/reducers/addonsByAuthors';
import collections from 'amo/reducers/collections';
import home from 'amo/reducers/home';
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
import heroBanners from 'core/reducers/heroBanners';
import infoDialog from 'core/reducers/infoDialog';
import installations from 'core/reducers/installations';
import redirectTo from 'core/reducers/redirectTo';
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
      collections,
      errors,
      errorPage,
      heroBanners,
      home,
      infoDialog,
      installations,
      landing,
      reduxAsyncConnect,
      redirectTo,
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
