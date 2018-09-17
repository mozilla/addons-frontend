/* @flow */
import config from 'config';
import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import About from 'amo/pages/StaticPages/About';
import Addon from 'amo/pages/Addon';
import AddonReviewList from 'amo/pages/AddonReviewList';
import CategoriesPage from 'amo/pages/CategoriesPage';
import Category from 'amo/pages/Category';
import Collection from 'amo/pages/Collection';
import CollectionEdit from 'amo/pages/CollectionEdit';
import CollectionList from 'amo/pages/CollectionList';
import Home from 'amo/pages/Home';
import LandingPage from 'amo/pages/LandingPage';
import LanguageTools from 'amo/pages/LanguageTools';
import SearchTools from 'amo/pages/SearchTools';
import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReviewGuide from 'amo/pages/StaticPages/ReviewGuide';
import SearchPage from 'amo/pages/SearchPage';
import ServerError from 'amo/components/ErrorPage/ServerError';
import UserProfile from 'amo/pages/UserProfile';
import UserProfileEdit from 'amo/pages/UserProfileEdit';
import SimulateAsyncError from 'core/pages/error-simulation/SimulateAsyncError';
import SimulateClientError from 'core/pages/error-simulation/SimulateClientError';
import SimulateSyncError from 'core/pages/error-simulation/SimulateSyncError';
import type { ConfigType } from 'core/types/config';

type Props = {|
  _config?: ConfigType,
|};

// If you add a new route here, check that the nginx rules maintained by ops
const Routes = ({ _config = config }: Props = {}) => (
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
      component={_config.get('isDevelopment') ? NotAuthorized : NotFound}
    />
    <Route exact path="/:lang/:application/404/" component={NotFound} />
    <Route
      exact
      path="/:lang/:application/500/"
      component={_config.get('isDevelopment') ? ServerError : NotFound}
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
