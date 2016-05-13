import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';

import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import auth from 'core/reducers/authentication';
import search from 'search/reducers/search';
import users from 'core/reducers/users';
import { middleware } from 'core/store';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({addons, api, auth, search, reduxAsyncConnect, users}),
    initialState,
    middleware(),
  );
}
