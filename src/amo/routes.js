import config from 'config';
import React from 'react';
import { IndexRoute, Route } from 'react-router';

import SimulateAsyncError from
  'core/containers/error-simulation/SimulateAsyncError';
import SimulateClientError from
  'core/containers/error-simulation/SimulateClientError';
import SimulateSyncError from
  'core/containers/error-simulation/SimulateSyncError';
import HandleLogin from 'core/containers/HandleLogin';

import AddonReviewList from './components/AddonReviewList';
import App from './components/App';
import CategoriesPage from './components/CategoriesPage';
import Category from './components/Category';
import FeaturedAddons from './components/FeaturedAddons';
import LandingPage from './components/LandingPage';
import Home from './components/Home';
import Addon from './components/Addon';
import NotAuthorized from './components/ErrorPage/NotAuthorized';
import NotFound from './components/ErrorPage/NotFound';
import SearchPage from './components/SearchPage';
import ServerError from './components/ErrorPage/ServerError';

// If you add a new route here, check that the nginx rules maintained by ops
// are in sync. See:
// https://github.com/mozilla-services/puppet-config/tree/master/amo

export default (
  <Route path="/:lang/:application" component={App}>
    <IndexRoute component={Home} />
    <Route path="addon/:slug/" component={Addon} />
    <Route path="addon/:addonSlug/reviews/" component={AddonReviewList} />
    <Route path=":visibleAddonType/categories/" component={CategoriesPage} />
    <Route path=":visibleAddonType/featured/" component={FeaturedAddons} />
    <Route path=":visibleAddonType/:slug/" component={Category} />
    <Route path="/api/v3/accounts/authenticate/" component={HandleLogin} />
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
);
