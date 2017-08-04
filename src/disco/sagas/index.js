// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { all, fork } from 'redux-saga/effects';
/* eslint-enable import/order */

import discovery from 'disco/sagas/discovery';


export default function* rootSaga() {
  yield all([
    fork(discovery),
  ]);
}
