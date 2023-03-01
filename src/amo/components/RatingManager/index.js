/* @flow */
/* eslint-disable react/no-unused-prop-types */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { oneLine } from 'common-tags';

import {
  SAVED_RATING,
  STARTED_SAVE_RATING,
  createAddonReview,
  fetchLatestUserReview,
  updateAddonReview,
} from 'amo/actions/reviews';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonReviewManagerRating from 'amo/components/AddonReviewManagerRating';
import RatingManagerNotice from 'amo/components/RatingManagerNotice';
import ReportAbuseButton from 'amo/components/ReportAbuseButton';
import { selectLatestUserReview } from 'amo/reducers/reviews';
import AuthenticateButton from 'amo/components/AuthenticateButton';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  validAddonTypes as defaultValidAddonTypes,
} from 'amo/constants';
import { withRenderedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import { sanitizeHTML } from 'amo/utils';
import { genericType, successType } from 'amo/components/Notice';
import UserRating from 'amo/components/UserRating';
import type { FlashMessageType, UserReviewType } from 'amo/actions/reviews';
import type { UserId } from 'amo/reducers/users';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {|
  addon: AddonType,
  version: AddonVersionType,
|};

type PropsFromState = {|
  beginningToDeleteReview: boolean,
  deletingReview: boolean,
  editingReview: boolean,
  flashMessage?: FlashMessageType | void,
  userId: UserId | null,
  userReview?: UserReviewType | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class RatingManagerBase extends React.Component<InternalProps> {
  componentDidMount() {
    const { addon, dispatch, errorHandler, userId, userReview } = this.props;

    if (
      errorHandler.hasError() &&
      // A 429 can result when a user tries to post too many ratings and gets
      // throttled. In that case we still want to try to load the rating,
      // especially if the user navigated to a new add-on.
      errorHandler.capturedError.responseStatusCode !== 429
    ) {
      log.warn('Not loading data because of an error');
      return;
    }

    if (userId && userReview === undefined) {
      log.debug(`Loading a saved rating (if it exists) for user ${userId}`);
      dispatch(
        fetchLatestUserReview({
          userId,
          addonId: addon.id,
          errorHandlerId: errorHandler.id,
        }),
      );
    }
  }

  onSelectRating: (score: number) => void = (score: number) => {
    const { addon, dispatch, errorHandler, userReview, version } = this.props;

    if (userReview) {
      dispatch(
        updateAddonReview({
          errorHandlerId: errorHandler.id,
          score,
          reviewId: userReview.id,
        }),
      );
    } else {
      dispatch(
        createAddonReview({
          addonId: addon.id,
          errorHandlerId: errorHandler.id,
          score,
          versionId: version.id,
        }),
      );
    }
  };

  getLogInPrompt(
    { addonType }: {| addonType: string |},
    {
      validAddonTypes = defaultValidAddonTypes,
    }: {
      validAddonTypes: typeof defaultValidAddonTypes,
    } = {},
  ): string {
    const { i18n } = this.props;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        return i18n.gettext('Log in to rate this dictionary');
      case ADDON_TYPE_LANG:
        return i18n.gettext('Log in to rate this language pack');
      case ADDON_TYPE_STATIC_THEME:
        return i18n.gettext('Log in to rate this theme');
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('Log in to rate this extension');
      default: {
        const validAddonType = validAddonTypes.includes(addonType);
        log.warn(
          `Using generic prompt for ${
            validAddonType ? 'add-on' : 'unknown add-on'
          } type: ${addonType}`,
        );
        return i18n.gettext('Log in to rate this add-on');
      }
    }
  }

  isSignedIn(): boolean {
    return Boolean(this.props.userId);
  }

  renderLogInToRate(): React.Node {
    const { addon } = this.props;

    return (
      <AuthenticateButton
        noIcon
        className="RatingManager-log-in-to-rate-button"
        logInText={this.getLogInPrompt({ addonType: addon.type })}
      />
    );
  }

  isMessageVisible(): boolean {
    const { flashMessage } = this.props;

    return [STARTED_SAVE_RATING, SAVED_RATING].includes(flashMessage);
  }

  renderUserRatingForm(): React.Node {
    const {
      addon,
      beginningToDeleteReview,
      deletingReview,
      i18n,
      flashMessage,
      userReview,
    } = this.props;

    const onDeleteScreen = beginningToDeleteReview || deletingReview;
    let prompt;
    if (userReview && onDeleteScreen) {
      if (userReview.body) {
        prompt = i18n.gettext(
          'Are you sure you want to delete your review of %(addonName)s?',
        );
      } else {
        // A review without a body is a rating.
        prompt = i18n.gettext(
          'Are you sure you want to delete your rating of %(addonName)s?',
        );
      }
    } else {
      prompt = i18n.gettext('How are you enjoying %(addonName)s?');
    }

    const promptHTML = sanitizeHTML(
      i18n.sprintf(prompt, { addonName: `<b>${addon.name}</b>` }),
      ['b'],
    );

    return (
      <form action="">
        <fieldset>
          {/* eslint-disable react/no-danger */}
          <legend
            className="RatingManager-legend"
            dangerouslySetInnerHTML={promptHTML}
          />
          {/* eslint-enable react/no-danger */}
          <div className="RatingManager-ratingControl">
            {!this.isSignedIn() ? this.renderLogInToRate() : null}
            {userReview && onDeleteScreen ? (
              <AddonReviewManagerRating
                className="RatingManager-AddonReviewManagerRating"
                onSelectRating={undefined}
                rating={userReview.score}
              />
            ) : (
              <UserRating
                className="RatingManager-UserRating"
                readOnly={!this.isSignedIn()}
                onSelectRating={this.onSelectRating}
                review={!this.isSignedIn() ? null : userReview}
              />
            )}
          </div>
          <RatingManagerNotice
            className={
              userReview && userReview.body
                ? 'RatingManager-savedRating-withReview'
                : null
            }
            hideMessage={!this.isMessageVisible()}
            message={
              flashMessage === STARTED_SAVE_RATING
                ? i18n.gettext('Saving star rating')
                : i18n.gettext('Star rating saved')
            }
            type={
              flashMessage === STARTED_SAVE_RATING ? genericType : successType
            }
          />
        </fieldset>
      </form>
    );
  }

  render(): React.Node {
    const { addon, editingReview, userReview, version } = this.props;

    invariant(addon, 'addon is required');
    invariant(version, 'version is required');

    return (
      <div className="RatingManager">
        {!editingReview && this.renderUserRatingForm()}
        {userReview && (
          <AddonReviewCard
            addon={addon}
            className="RatingManager-AddonReviewCard"
            flaggable={false}
            review={userReview}
            shortByLine
            showControls={!this.isMessageVisible()}
            showRating={false}
            siteUserCanReply={false}
            slim
          />
        )}
        <ReportAbuseButton addon={addon} />
      </div>
    );
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: Props,
): PropsFromState => {
  const userId = state.users.currentUserID;
  let userReview;
  if (userId && ownProps.addon) {
    const addonId = ownProps.addon.id;

    log.debug(oneLine`Looking for latest review of
      addonId "${addonId}" by userId "${userId}"`);

    userReview = selectLatestUserReview({
      reviewsState: state.reviews,
      userId,
      addonId,
    });
  }

  let deletingReview = false;
  let beginningToDeleteReview = false;
  let editingReview = false;
  if (userReview) {
    const view = state.reviews.view[userReview.id];
    if (view) {
      beginningToDeleteReview = view.beginningToDeleteReview;
      deletingReview = view.deletingReview;
      editingReview = view.editingReview;
    }
  }

  return {
    beginningToDeleteReview,
    deletingReview,
    editingReview,
    flashMessage: state.reviews.flashMessage,
    userReview,
    userId,
  };
};

export const RatingManagerWithI18n: React.ComponentType<Props> =
  translate()(RatingManagerBase);

const RatingManager: React.ComponentType<Props> = compose(
  withRenderedErrorHandler({ id: 'RatingManager' }),
  connect(mapStateToProps),
)(RatingManagerWithI18n);

export default RatingManager;
