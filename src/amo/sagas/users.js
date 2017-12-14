import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  FETCH_USER_ACCOUNT,
  loadCurrentUserAccount,
  loadUserAccount,
} from 'amo/reducers/users';
import {
  currentUserAccount as currentUserAccountApi,
  userAccount as userAccountApi,
} from 'amo/api/users';
import { SET_AUTH_TOKEN } from 'core/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


// This saga is not triggered by the UI but on the server side, hence do not
// have a `errorHandler`. We do not want to miss any error because it would
// mean no ways for the users to log in, so we let the errors bubble up.
export function* fetchCurrentUserAccount({ payload }) {
  const { token } = payload;

  const state = yield select(getState);

  const response = yield call(currentUserAccountApi, {
    api: {
      ...state.api,
      token,
    },
  });

  yield put(loadCurrentUserAccount({ user: response }));
}

export function* fetchUserAccount({
  payload: {
    errorHandlerId,
    username,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const user = yield call(userAccountApi, {
      api: state.api,
      username,
    });

    yield put(loadUserAccount({ user }));
  } catch (error) {
    log.warn(`User account failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* usersSaga() {
  yield takeLatest(SET_AUTH_TOKEN, fetchCurrentUserAccount);
  yield takeLatest(FETCH_USER_ACCOUNT, fetchUserAccount);
}
