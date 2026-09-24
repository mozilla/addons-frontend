/* @flow */
/* global window */
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
import AddonFeedback from 'amo/pages/AddonFeedback';
import CollectionFeedback from 'amo/pages/CollectionFeedback';
import UserFeedback from 'amo/pages/UserFeedback';
import RatingFeedback from 'amo/pages/RatingFeedback';
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
import TagPage from 'amo/pages/TagPage';
import universalWindow from 'amo/window';
import type { ConfigType } from 'amo/types/config';

type Props = {
  _config?: ConfigType,
  _window?: typeof window,
};

// If you add a new route here, check the nginx rules maintained by ops.
const Routes = ({
  _config = config,
  _window = universalWindow,
}: Props = {}): React.Node => (
  <Switch>
    <Route exact path="/:lang/about" component={About} />
    {/* TODO: Post launch update this URL and redirect see #3374/ */}
    <Route exact path="/:lang/review_guide" component={ReviewGuide} />
    <Route exact path="/:lang/:application(firefox)/" component={Home} />
    <Route
      exact
      path="/:lang/:application(firefox)/addon/:slug/"
      component={Addon}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/blocked-addon/:guid/:versionId?/"
      component={Block}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/addon/:addonSlug/reviews/:reviewId"
      component={AddonReviewList}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/addon/:addonSlug/reviews/"
      component={AddonReviewList}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/addon/:slug/privacy/"
      component={(props) => (
        <AddonInfo {...props} infoType={ADDON_INFO_TYPE_PRIVACY_POLICY} />
      )}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/addon/:slug/eula/"
      component={(props) => (
        <AddonInfo {...props} infoType={ADDON_INFO_TYPE_EULA} />
      )}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/addon/:slug/license/"
      component={(props) => (
        <AddonInfo {...props} infoType={ADDON_INFO_TYPE_CUSTOM_LICENSE} />
      )}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/addon/:slug/versions/"
      component={AddonVersions}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/users/edit"
      render={(props) => <UserProfileEdit _window={_window} {...props} />}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/user/:userId/edit/"
      render={(props) => <UserProfileEdit _window={_window} {...props} />}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/user/:userId/"
      component={UserProfile}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/collections/:userId/:slug/"
      component={Collection}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/collections/"
      component={CollectionList}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/collections/add/"
      component={(props) => <Collection {...props} creating />}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/collections/:userId/:slug/edit/"
      component={CollectionEdit}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/:visibleAddonType(extensions)/categories/"
      component={CategoriesPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/:visibleAddonType(extensions)/category/:categorySlug/"
      component={CategoryPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/:visibleAddonType(themes)/categories/"
      component={CategoriesPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/:visibleAddonType(themes)/category/:categorySlug/"
      component={CategoryPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/tag/:tag/"
      component={TagPage}
    />
    <Route
      key="addon-feedback"
      exact
      path="/:lang/:application(firefox)/feedback/addon/:addonIdentifier/"
      component={AddonFeedback}
    />
    ,
    <Route
      key="collection-feedback"
      exact
      path="/:lang/:application(firefox)/feedback/collection/:authorId/:collectionSlug/"
      component={CollectionFeedback}
    />
    ,
    <Route
      key="user-feedback"
      exact
      path="/:lang/:application(firefox)/feedback/user/:userId/"
      component={UserFeedback}
    />
    ,
    <Route
      key="rating-feedback"
      exact
      path="/:lang/:application(firefox)/feedback/review/:ratingId/"
      component={RatingFeedback}
    />
    ,
    <Route
      exact
      path="/:lang/:application(firefox)/language-tools/"
      component={LanguageTools}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/search-tools/"
      component={SearchTools}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/search/"
      component={SearchPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/401/"
      component={
        _config.get('isDevelopment') ? NotAuthorizedPage : NotFoundPage
      }
    />
    <Route
      exact
      path="/:lang/:application(firefox)/404/"
      component={NotFoundPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/451/"
      component={UnavailableForLegalReasonsPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/500/"
      component={_config.get('isDevelopment') ? ServerErrorPage : NotFoundPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/simulate-async-error/"
      component={() => (
        <Page showWrongPlatformWarning={false}>
          <SimulateAsyncError />
        </Page>
      )}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/simulate-sync-error/"
      component={() => (
        <Page showWrongPlatformWarning={false}>
          <SimulateSyncError />
        </Page>
      )}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/:visibleAddonType(extensions)/"
      component={LandingPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/:visibleAddonType(themes)/"
      component={LandingPage}
    />
    <Route
      exact
      path="/:lang/:application(firefox)/users/unsubscribe/:token/:hash/:notificationName/"
      component={UsersUnsubscribe}
    />
    <Route component={NotFoundPage} />
  </Switch>
);

export default Routes;
