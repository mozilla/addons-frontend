import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';

import { middleware } from 'core/store';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import auth from 'core/reducers/authentication';
import search from 'core/reducers/search';
import ratings from 'amo/reducers/ratings';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({ addons, api, auth, search, ratings, reduxAsyncConnect }),
    initialState,
    middleware(),
  );
}
