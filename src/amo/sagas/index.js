// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { all, fork } from 'redux-saga/effects';
/* eslint-enable import/order */

import addonsByAuthors from 'amo/sagas/addonsByAuthors';
import categories from 'amo/sagas/categories';
import collections from 'amo/sagas/collections';
import home from 'amo/sagas/home';
import landing from 'amo/sagas/landing';
import reviews from 'amo/sagas/reviews';
import abuse from 'core/sagas/abuse';
import addons from 'core/sagas/addons';
import search from 'core/sagas/search';
import autocomplete from 'core/sagas/autocomplete';
import languageTools from 'core/sagas/languageTools';
import users from 'amo/sagas/users';
import user from 'core/sagas/user';


// Export all sagas for this app so runSaga can consume them.
export default function* rootSaga() {
  yield all([
    fork(abuse),
    fork(addons),
    fork(addonsByAuthors),
    fork(autocomplete),
    fork(categories),
    fork(collections),
    fork(home),
    fork(landing),
    fork(languageTools),
    fork(reviews),
    fork(search),
    fork(user),
    fork(users),
  ]);
}
