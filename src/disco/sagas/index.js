// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { all, fork } from 'redux-saga/effects';
/* eslint-enable import/order */

import disco from 'disco/sagas/disco';

export default function* rootSaga() {
  yield all([fork(disco)]);
}
