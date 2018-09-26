/* @flow */
import config from 'config';
import * as React from 'react';
import { Route, Switch } from 'react-router-dom';
import Loadable from 'react-loadable';

import Home from 'amo/pages/Home';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ServerError from 'amo/components/ErrorPage/ServerError';
import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import type { ConfigType } from 'core/types/config';

const About = Loadable({
  loader: () => import('amo/pages/StaticPages/About'),
  loading: () => <div>Loading...</div>,
});

const LandingPage = Loadable({
  loader: () => import('amo/pages/LandingPage'),
  loading: () => <div>Loading...</div>,
});

const CategoriesPage = Loadable({
  loader: () => import('amo/pages/CategoriesPage'),
  loading: () => <div>Loading...</div>,
});

const Addon = Loadable({
  loader: () => import('amo/pages/Addon'),
  loading: () => <div>Loading...</div>,
});

const AddonReviewList = Loadable({
  loader: () => import('amo/pages/AddonReviewList'),
  loading: () => <div>Loading...</div>,
});

const CollectionEdit = Loadable({
  loader: () => import('amo/pages/CollectionEdit'),
  loading: () => <div>Loading...</div>,
});

const LanguageTools = Loadable({
  loader: () => import('amo/pages/LanguageTools'),
  loading: () => <div>Loading...</div>,
});

const Collection = Loadable({
  loader: () => import('amo/pages/Collection'),
  loading: () => <div>Loading...</div>,
});

const CollectionList = Loadable({
  loader: () => import('amo/pages/CollectionList'),
  loading: () => <div>Loading...</div>,
});

const Category = Loadable({
  loader: () => import('amo/pages/Category'),
  loading: () => <div>Loading...</div>,
});

const ReviewGuide = Loadable({
  loader: () => import('amo/pages/StaticPages/ReviewGuide'),
  loading: () => <div>Loading...</div>,
});

const SearchPage = Loadable({
  loader: () => import('amo/pages/StaticPages/ReviewGuide'),
  loading: () => <div>Loading...</div>,
});

const UserProfile = Loadable({
  loader: () => import('amo/pages/UserProfile'),
  loading: () => <div>Loading...</div>,
});

const UserProfileEdit = Loadable({
  loader: () => import('amo/pages/UserProfileEdit'),
  loading: () => <div>Loading...</div>,
});

const SearchTools = Loadable({
  loader: () => import('amo/pages/SearchTools'),
  loading: () => <div>Loading...</div>,
});

const SimulateAsyncError = Loadable({
  loader: () => import('core/pages/error-simulation/SimulateAsyncError'),
  loading: () => <div>Loading...</div>,
});

const SimulateClientError = Loadable({
  loader: () => import('core/pages/error-simulation/SimulateClientError'),
  loading: () => <div>Loading...</div>,
});

const SimulateSyncError = Loadable({
  loader: () => import('core/pages/error-simulation/SimulateSyncError'),
  loading: () => <div>Loading...</div>,
});

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
      path="/:lang/:application/addon/:addonSlug/reviews/:reviewId"
      component={AddonReviewList}
    />
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
