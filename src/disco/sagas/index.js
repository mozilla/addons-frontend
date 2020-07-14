/* @flow */
import { all, fork } from 'redux-saga/effects';

import disco from 'disco/sagas/disco';
import type { Saga } from 'core/types/sagas';

export default function* rootSaga(): Saga {
  yield all([fork(disco)]);
}
