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
import recommendations from 'amo/sagas/recommendations';
import reviews from 'amo/sagas/reviews';
import abuse from 'core/sagas/abuse';
import addons from 'core/sagas/addons';
import search from 'core/sagas/search';
import autocomplete from 'core/sagas/autocomplete';
import languageTools from 'core/sagas/languageTools';
import userAbuseReports from 'amo/sagas/userAbuseReports';
import users from 'amo/sagas/users';
import versions from 'amo/sagas/versions';

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
    fork(recommendations),
    fork(reviews),
    fork(search),
    fork(userAbuseReports),
    fork(users),
    fork(versions),
  ]);
}
