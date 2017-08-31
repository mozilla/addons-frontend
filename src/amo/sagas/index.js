// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { all, fork } from 'redux-saga/effects';
/* eslint-enable import/order */

import categories from 'amo/sagas/categories';
import featured from 'amo/sagas/featured';
import landing from 'amo/sagas/landing';
import reviews from 'amo/sagas/reviews';
import addons from 'core/sagas/addons';
import search from 'core/sagas/search';
import autocomplete from 'core/sagas/autocomplete';
import user from 'core/sagas/user';


// Export all sagas for this app so runSaga can consume them.
export default function* rootSaga() {
  yield all([
    fork(addons),
    fork(autocomplete),
    fork(categories),
    fork(featured),
    fork(landing),
    fork(reviews),
    fork(search),
    fork(user),
  ]);
}
