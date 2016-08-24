import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';

import addons from 'core/reducers/addons';
import admin from 'admin/reducers/admin';
import api from 'core/reducers/api';
import auth from 'core/reducers/authentication';
import users from 'core/reducers/users';
import { middleware } from 'core/store';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({ addons, admin, api, auth, reduxAsyncConnect, users }),
    initialState,
    middleware(),
  );
}
