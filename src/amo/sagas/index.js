/* @flow */
import { all, fork } from 'redux-saga/effects';

import addonsByAuthors from 'amo/sagas/addonsByAuthors';
import blocks from 'amo/sagas/blocks';
import collections from 'amo/sagas/collections';
import collectionAbuseReports from 'amo/sagas/collectionAbuseReports';
import home from 'amo/sagas/home';
import landing from 'amo/sagas/landing';
import recommendations from 'amo/sagas/recommendations';
import reviews from 'amo/sagas/reviews';
import abuse from 'amo/sagas/abuse';
import addons from 'amo/sagas/addons';
import categories from 'amo/sagas/categories';
import search from 'amo/sagas/search';
import site from 'amo/sagas/site';
import autocomplete from 'amo/sagas/autocomplete';
import languageTools from 'amo/sagas/languageTools';
import userAbuseReports from 'amo/sagas/userAbuseReports';
import users from 'amo/sagas/users';
import versions from 'amo/sagas/versions';
import suggestions from 'amo/sagas/suggestions';
import type { Saga } from 'amo/types/sagas';

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
    fork(collectionAbuseReports),
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
    fork(suggestions),
  ]);
}
