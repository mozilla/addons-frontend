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
import CategoryList from './components/CategoryList';
import CategoryPage from './components/CategoryPage';
import FeaturedAddons from './components/FeaturedAddons';
import LandingPage from './components/LandingPage';
import Home from './components/Home';
import DetailPage from './components/DetailPage';
import NotAuthorized from './components/ErrorPage/NotAuthorized';
import NotFound from './components/ErrorPage/NotFound';
import SearchPage from './components/SearchPage';
import ServerError from './components/ErrorPage/ServerError';


export default (
  <Route path="/:lang/:application" component={App}>
    <IndexRoute component={Home} />
    <Route path="addon/:slug/" component={DetailPage} />
    <Route path="addon/:addonSlug/reviews/" component={AddonReviewList} />
    {/* These user routes are to make the proxy serve each URL from */}
    {/* addons-server until we can fix the :visibleAddonType route below. */}
    {/* https://github.com/mozilla/addons-frontend/issues/2029 */}
    {/* We are mimicing these URLs: https://github.com/mozilla/addons-server/blob/master/src/olympia/users/urls.py#L20 */}
    <Route path="users/:userAction" component={NotFound} />
    <Route path="users/:userAction/" component={NotFound} />
    {/* https://github.com/mozilla/addons-frontend/issues/1975 */}
    <Route path="user/:user/" component={NotFound} />
    <Route path=":visibleAddonType/categories/" component={CategoryList} />
    <Route path=":visibleAddonType/featured/" component={FeaturedAddons} />
    <Route path=":visibleAddonType/:slug/" component={CategoryPage} />
    <Route path="/api/v3/accounts/authenticate/" component={HandleLogin} />
    <Route path="search/" component={SearchPage} />
    <Route path="401/"
      component={config.get('isDevelopment') ? NotAuthorized : NotFound} />
    <Route path="404/" component={NotFound} />
    <Route path="500/"
      component={config.get('isDevelopment') ? ServerError : NotFound} />
    <Route path="simulate-async-error/" component={SimulateAsyncError} />
    <Route path="simulate-sync-error/" component={SimulateSyncError} />
    <Route path="simulate-client-error/" component={SimulateClientError} />
    <Route path=":visibleAddonType/" component={LandingPage} />
    <Route path="*" component={NotFound} />
  </Route>
);
