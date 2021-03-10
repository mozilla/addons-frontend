/* @flow */
import config from 'config';
import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import Addon from 'amo/pages/Addon';
import AddonInfo, {
  ADDON_INFO_TYPE_CUSTOM_LICENSE,
  ADDON_INFO_TYPE_EULA,
  ADDON_INFO_TYPE_PRIVACY_POLICY,
} from 'amo/pages/AddonInfo';
import AddonReviewList from 'amo/pages/AddonReviewList';
import AddonVersions from 'amo/pages/AddonVersions';
import CategoriesPage from 'amo/pages/CategoriesPage';
import CategoryPage from 'amo/pages/CategoryPage';
import Collection from 'amo/pages/Collection';
import CollectionEdit from 'amo/pages/CollectionEdit';
import CollectionList from 'amo/pages/CollectionList';
import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import UnavailableForLegalReasonsPage from 'amo/pages/ErrorPages/UnavailableForLegalReasonsPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';
import Block from 'amo/pages/Block';
import Home from 'amo/pages/Home';
import LandingPage from 'amo/pages/LandingPage';
import LanguageTools from 'amo/pages/LanguageTools';
import SearchTools from 'amo/pages/SearchTools';
import Page from 'amo/components/Page';
import SearchPage from 'amo/pages/SearchPage';
import UserProfile from 'amo/pages/UserProfile';
import UserProfileEdit from 'amo/pages/UserProfileEdit';
import UsersUnsubscribe from 'amo/pages/UsersUnsubscribe';
import SimulateAsyncError from 'amo/pages/error-simulation/SimulateAsyncError';
import SimulateSyncError from 'amo/pages/error-simulation/SimulateSyncError';
import About from 'amo/pages/StaticPages/About';
import ReviewGuide from 'amo/pages/StaticPages/ReviewGuide';
import type { ConfigType } from 'amo/types/config';

type Props = {|
  _config?: ConfigType,
|};

// If you add a new route here, check the nginx rules maintained by ops.
const Routes = ({ _config = config }: Props = {}): React.Node => (
  <Switch>
    <Route exact path="/:lang/about" component={About} />
    {/* TODO: Post launch update this URL and redirect see #3374/ */}
    <Route exact path="/:lang/review_guide" component={ReviewGuide} />

    <Route exact path="/:lang/:application/" component={Home} />

    <Route exact path="/:lang/:application/addon/:slug/" component={Addon} />

    {_config.get('enableFeatureBlockPage') && (
      <Route
        exact
        path="/:lang/:application/blocked-addon/:guid/:versionId?/"
        component={Block}
      />
    )}

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
      path="/:lang/:application/addon/:slug/privacy/"
      component={(props) => (
        <AddonInfo {...props} infoType={ADDON_INFO_TYPE_PRIVACY_POLICY} />
      )}
    />

    <Route
      exact
      path="/:lang/:application/addon/:slug/eula/"
      component={(props) => (
        <AddonInfo {...props} infoType={ADDON_INFO_TYPE_EULA} />
      )}
    />

    <Route
      exact
      path="/:lang/:application/addon/:slug/license/"
      component={(props) => (
        <AddonInfo {...props} infoType={ADDON_INFO_TYPE_CUSTOM_LICENSE} />
      )}
    />

    <Route
      exact
      path="/:lang/:application/addon/:slug/versions/"
      component={AddonVersions}
    />

    <Route
      exact
      path="/:lang/:application/users/edit"
      component={UserProfileEdit}
    />
    <Route
      exact
      path="/:lang/:application/user/:userId/edit/"
      component={UserProfileEdit}
    />
    <Route
      exact
      path="/:lang/:application/user/:userId/"
      component={UserProfile}
    />

    <Route
      exact
      path="/:lang/:application/collections/:userId/:slug/"
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
      path="/:lang/:application/collections/:userId/:slug/edit/"
      component={CollectionEdit}
    />

    <Route
      exact
      path="/:lang/:application/:visibleAddonType(extensions|themes)/categories/"
      component={CategoriesPage}
    />

    <Route
      exact
      path="/:lang/:application/:visibleAddonType(extensions|themes)/:categorySlug/"
      component={CategoryPage}
    />

    {/* See: https://github.com/mozilla/addons-frontend/issues/5150 */}
    <Route
      exact
      path="/:lang/android/language-tools/"
      component={NotFoundPage}
    />
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
      component={
        _config.get('isDevelopment') ? NotAuthorizedPage : NotFoundPage
      }
    />
    <Route exact path="/:lang/:application/404/" component={NotFoundPage} />
    <Route
      exact
      path="/:lang/:application/451/"
      component={UnavailableForLegalReasonsPage}
    />
    <Route
      exact
      path="/:lang/:application/500/"
      component={_config.get('isDevelopment') ? ServerErrorPage : NotFoundPage}
    />

    <Route
      exact
      path="/:lang/:application/simulate-async-error/"
      component={() => (
        <Page showWrongPlatformWarning={false}>
          <SimulateAsyncError />
        </Page>
      )}
    />
    <Route
      exact
      path="/:lang/:application/simulate-sync-error/"
      component={() => (
        <Page showWrongPlatformWarning={false}>
          <SimulateSyncError />
        </Page>
      )}
    />
    <Route
      exact
      path="/:lang/:application/:visibleAddonType(extensions|themes)/"
      component={LandingPage}
    />

    <Route
      exact
      path="/:lang/:application/users/unsubscribe/:token/:hash/:notificationName/"
      component={UsersUnsubscribe}
    />

    <Route component={NotFoundPage} />
  </Switch>
);

export default Routes;
