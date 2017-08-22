// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { SET_AUTH_TOKEN } from 'core/constants';
import { getState } from 'core/sagas/utils';
import { userProfileLoaded } from 'core/reducers/user';
import { userProfile as userProfileApi } from 'core/api/user';

// This saga is not triggered by the UI but on the server side, hence do not
// have a `errorHandler`. We do not want to miss any error because it would
// mean no ways for the users to log in, so we let the errors bubble up.
export function* fetchUserProfile({ payload }) {
  const { token } = payload;

  const state = yield select(getState);

  const response = yield call(userProfileApi, {
    api: {
      ...state.api,
      token,
    },
  });

  yield put(userProfileLoaded({ profile: response }));
}

export default function* userSaga() {
  yield takeLatest(SET_AUTH_TOKEN, fetchUserProfile);
}
