import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';

import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import auth from 'core/reducers/authentication';
import i18n from 'core/reducers/i18n';
import search from 'core/reducers/search';
import users from 'core/reducers/users';
import { middleware } from 'core/store';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({ addons, api, auth, i18n, search, reduxAsyncConnect, users }),
    initialState,
    middleware(),
  );
}
