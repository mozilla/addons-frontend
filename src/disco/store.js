import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';

import { middleware } from 'core/store';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import infoDialog from 'core/reducers/infoDialog';
import discoResults from 'disco/reducers/discoResults';
import installations from 'disco/reducers/installations';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({ addons, api, discoResults, installations, infoDialog, reduxAsyncConnect }),
    initialState,
    middleware(),
  );
}
