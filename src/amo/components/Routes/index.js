/* @flow */
import config from 'config';
import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import About from 'amo/components/StaticPages/About';
import Addon from 'amo/components/Addon';
import AddonReviewList from 'amo/components/AddonReviewList';
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
const Routes = () => (
  <Switch>
    <Route exact path="/:lang/about" component={About} />
    {/* TODO: Post launch update this URL and redirect see #3374/ */}
    <Route exact path="/:lang/review_guide" component={ReviewGuide} />

    <Route exact path="/:lang/:application/" component={Home} />

    <Route exact path="/:lang/:application/addon/:slug/" component={Addon} />
    <Route
      exact
      path="/:lang/:application/addon/:addonSlug/reviews/"
      component={AddonReviewList}
    />

    <Route
      exact
      path="/:lang/:application/users/edit"
      component={UserProfileEdit}
    />
    <Route
      exact
      path="/:lang/:application/user/:username/edit/"
      component={UserProfileEdit}
    />
    <Route
      exact
      path="/:lang/:application/user/:username/"
      component={UserProfile}
    />

    <Route
      exact
      path="/:lang/:application/collections/:username/:slug/"
      component={Collection}
    />
    <Route
      exact
      path="/:lang/:application/collections/"
      component={CollectionList}
    />
    <Route
      exact
      path="/:lang/:application/collections/add/"
      component={(props) => <Collection {...props} creating />}
    />
    <Route
      exact
      path="/:lang/:application/collections/:username/:slug/edit/"
      component={CollectionEdit}
    />

    <Route
      exact
      path="/:lang/:application/:visibleAddonType/categories/"
      component={CategoriesPage}
    />
    <Route
      exact
      path="/:lang/:application/:visibleAddonType/:slug/"
      component={Category}
    />

    {/* See: https://github.com/mozilla/addons-frontend/issues/5150 */}
    <Route exact path="/:lang/android/language-tools/" component={NotFound} />
    <Route
      exact
      path="/:lang/:application/language-tools/"
      component={LanguageTools}
    />
    <Route
      exact
      path="/:lang/:application/search-tools/"
      component={SearchTools}
    />
    <Route exact path="/:lang/:application/search/" component={SearchPage} />

    <Route
      exact
      path="/:lang/:application/401/"
      component={config.get('isDevelopment') ? NotAuthorized : NotFound}
    />
    <Route exact path="/:lang/:application/404/" component={NotFound} />
    <Route
      exact
      path="/:lang/:application/500/"
      component={config.get('isDevelopment') ? ServerError : NotFound}
    />

    <Route
      exact
      path="/:lang/:application/simulate-async-error/"
      component={SimulateAsyncError}
    />
    <Route
      exact
      path="/:lang/:application/simulate-sync-error/"
      component={SimulateSyncError}
    />
    <Route
      exact
      path="/:lang/:application/simulate-client-error/"
      component={SimulateClientError}
    />
    <Route
      exact
      path="/:lang/:application/:visibleAddonType/"
      component={LandingPage}
    />

    <Route component={NotFound} />
  </Switch>
);

export default Routes;
