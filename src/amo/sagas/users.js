import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  FETCH_USER_ACCOUNT,
  loadUserAccount,
} from 'amo/reducers/users';
import { userAccount as userAccountApi } from 'amo/api/users';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


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
  yield takeLatest(FETCH_USER_ACCOUNT, fetchUserAccount);
}
