import config from 'config';
import * as React from 'react';
import { IndexRoute, Route } from 'react-router';

import About from 'amo/components/StaticPages/About';
import Addon from 'amo/components/Addon';
import AddonReviewList from 'amo/components/AddonReviewList';
import App from 'amo/components/App';
import CategoriesPage from 'amo/components/CategoriesPage';
import Category from 'amo/components/Category';
import Collection from 'amo/components/Collection';
import CollectionEdit from 'amo/components/CollectionEdit';
import CollectionList from 'amo/components/CollectionList';
import Home from 'amo/components/Home';
import LandingPage from 'amo/components/LandingPage';
import LanguageTools from 'amo/components/LanguageTools';
import SearchTools from 'amo/components/SearchTools';
import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReviewGuide from 'amo/components/StaticPages/ReviewGuide';
import SearchPage from 'amo/components/SearchPage';
import ServerError from 'amo/components/ErrorPage/ServerError';
import UserProfile from 'amo/components/UserProfile';
import UserProfileEdit from 'amo/components/UserProfileEdit';
import SimulateAsyncError from 'core/components/error-simulation/SimulateAsyncError';
import SimulateClientError from 'core/components/error-simulation/SimulateClientError';
import SimulateSyncError from 'core/components/error-simulation/SimulateSyncError';

// If you add a new route here, check that the nginx rules maintained by ops
// are in sync. See:
// https://github.com/mozilla-services/puppet-config/tree/master/amo
export default (
  <React.Fragment>
    <Route path="/:lang" component={App}>
      <Route path="about" component={About} />
      {/* TODO: Post launch update this URL and redirect see #3374/ */}
      <Route path="review_guide" component={ReviewGuide} />
    </Route>
    <Route path="/:lang/:application" component={App}>
      <IndexRoute component={Home} />
      <Route path="addon/:slug/" component={Addon} />
      <Route path="addon/:addonSlug/reviews/" component={AddonReviewList} />
      <Route path="users/edit" component={UserProfileEdit} />
      <Route path="user/:username/edit/" component={UserProfileEdit} />
      <Route path="user/:username/" component={UserProfile} />
      <Route path="collections/:username/:slug/" component={Collection} />
      <Route path="collections/" component={CollectionList} />
      <Route
        path="collections/add/"
        component={(props) => <Collection {...props} creating />}
      />
      <Route
        path="collections/:username/:slug/edit/"
        component={CollectionEdit}
      />
      <Route path=":visibleAddonType/categories/" component={CategoriesPage} />
      <Route path=":visibleAddonType/:slug/" component={Category} />

      {/* See: https://github.com/mozilla/addons-frontend/issues/5150 */}
      <Route path="/:lang/android/language-tools/" component={NotFound} />

      <Route path="language-tools/" component={LanguageTools} />
      <Route path="search-tools/" component={SearchTools} />
      <Route path="search/" component={SearchPage} />
      <Route
        path="401/"
        component={config.get('isDevelopment') ? NotAuthorized : NotFound}
      />
      <Route path="404/" component={NotFound} />
      <Route
        path="500/"
        component={config.get('isDevelopment') ? ServerError : NotFound}
      />
      <Route path="simulate-async-error/" component={SimulateAsyncError} />
      <Route path="simulate-sync-error/" component={SimulateSyncError} />
      <Route path="simulate-client-error/" component={SimulateClientError} />
      <Route path=":visibleAddonType/" component={LandingPage} />
      <Route path="*" component={NotFound} />
    </Route>
  </React.Fragment>
);
