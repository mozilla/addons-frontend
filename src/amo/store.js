import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';

import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import auth from 'core/reducers/authentication';
import categories from 'core/reducers/categories';
import errors from 'core/reducers/errors';
import installations from 'core/reducers/installations';
import reviews from 'amo/reducers/reviews';
import search from 'core/reducers/search';
import { middleware } from 'core/store';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({
      addons, api, auth, categories, errors, installations, search, reviews,
      reduxAsyncConnect,
    }),
    initialState,
    middleware(),
  );
}
