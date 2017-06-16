import { fork } from 'redux-saga/effects';

import addons from 'core/sagas/addons';

import categories from './categories';


// Export all sagas for this app so runSaga can consume them.
export default function* rootSaga() {
  yield [
    fork(addons),
    fork(categories),
  ];
}
