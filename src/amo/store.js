import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';

import featured from 'amo/reducers/featured';
import highlyRated from 'amo/reducers/highlyRated';
import popular from 'amo/reducers/popular';
import reviews from 'amo/reducers/reviews';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import auth from 'core/reducers/authentication';
import categories from 'core/reducers/categories';
import installations from 'core/reducers/installations';
import search from 'core/reducers/search';
import { middleware } from 'core/store';


export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({
      addons,
      api,
      auth,
      categories,
      featured,
      highlyRated,
      installations,
      search,
      popular,
      reviews,
      reduxAsyncConnect,
    }),
    initialState,
    middleware(),
  );
}
