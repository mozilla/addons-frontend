import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';

import { middleware } from 'core/store';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import errorPage from 'core/reducers/errorPage';
import infoDialog from 'core/reducers/infoDialog';
import installations from 'core/reducers/installations';
import discoResults from 'disco/reducers/discoResults';


export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({
      addons,
      api,
      discoResults,
      errorPage,
      installations,
      infoDialog,
      reduxAsyncConnect,
    }),
    initialState,
    middleware(),
  );
}
