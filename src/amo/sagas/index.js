/* @flow */
import { all, fork } from 'redux-saga/effects';

import addonsByAuthors from 'amo/sagas/addonsByAuthors';
import blocks from 'amo/sagas/blocks';
import collections from 'amo/sagas/collections';
import guides from 'amo/sagas/guides';
import home from 'amo/sagas/home';
import landing from 'amo/sagas/landing';
import recommendations from 'amo/sagas/recommendations';
import reviews from 'amo/sagas/reviews';
import abuse from 'core/sagas/abuse';
import addons from 'core/sagas/addons';
import categories from 'core/sagas/categories';
import search from 'core/sagas/search';
import site from 'core/sagas/site';
import autocomplete from 'core/sagas/autocomplete';
import languageTools from 'core/sagas/languageTools';
import userAbuseReports from 'amo/sagas/userAbuseReports';
import users from 'amo/sagas/users';
import versions from 'core/sagas/versions';
import type { Saga } from 'core/types/sagas';

// Export all sagas for this app so runSaga can consume them.
export default function* rootSaga(): Saga {
  yield all([
    fork(abuse),
    fork(addons),
    fork(addonsByAuthors),
    fork(autocomplete),
    fork(blocks),
    fork(categories),
    fork(collections),
    fork(guides),
    fork(home),
    fork(landing),
    fork(languageTools),
    fork(recommendations),
    fork(reviews),
    fork(search),
    fork(site),
    fork(userAbuseReports),
    fork(users),
    fork(versions),
  ]);
}
