/* @flow */
/* global Node */
/* eslint-disable react/sort-comp, react/no-unused-prop-types */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { oneLine } from 'common-tags';

import { withRenderedErrorHandler } from 'core/errorHandler';
import { setReview } from 'amo/actions/reviews';
import { getLatestUserReview, submitReview } from 'amo/api/reviews';
import DefaultAddonReview from 'amo/components/AddonReview';
import DefaultAuthenticateButton from 'core/components/AuthenticateButton';
import DefaultReportAbuseButton from 'amo/components/ReportAbuseButton';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  validAddonTypes as defaultValidAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import DefaultUserRating from 'ui/components/UserRating';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { UserReviewType } from 'amo/actions/reviews';
import type {
  GetLatestReviewParams,
  SubmitReviewParams,
} from 'amo/api/reviews';
import type { DispatchFunc } from 'core/types/redux';
import type { ApiState } from 'core/reducers/api';
import type { AddonType, AddonVersionType } from 'core/types/addons';
import type { ReactRouterLocationType } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type LoadSavedReviewFunc = ({|
  addonId: $PropertyType<GetLatestReviewParams, 'addon'>,
  apiState: ApiState,
  userId: $PropertyType<GetLatestReviewParams, 'user'>,
  versionId: $PropertyType<GetLatestReviewParams, 'version'>,
|}) => Promise<any>;

type SubmitReviewFunc = (SubmitReviewParams) => Promise<void>;

type Props = {|
  addon: AddonType,
  location: ReactRouterLocationType,
  onReviewSubmitted?: () => void,
  version: AddonVersionType,
|};

type DispatchMappedProps = {|
  loadSavedReview: LoadSavedReviewFunc,
  submitReview: SubmitReviewFunc,
|};

type InternalProps = {|
  ...Props,
  ...DispatchMappedProps,
  AddonReview: typeof DefaultAddonReview,
  AuthenticateButton: typeof DefaultAuthenticateButton,
  UserRating: typeof DefaultUserRating,
  ReportAbuseButton: typeof DefaultReportAbuseButton,
  apiState: ApiState,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  userId: number,
  userReview: UserReviewType,
|};

type State = {|
  showTextEntry: boolean,
|};

export class RatingManagerBase extends React.Component<InternalProps, State> {
  ratingLegend: React.ElementRef<'legend'> | null;

  static defaultProps = {
    AddonReview: DefaultAddonReview,
    AuthenticateButton: DefaultAuthenticateButton,
    UserRating: DefaultUserRating,
    ReportAbuseButton: DefaultReportAbuseButton,
  };

  constructor(props: InternalProps) {
    super(props);
    const { apiState, loadSavedReview, userId, addon, version } = props;
    this.state = { showTextEntry: false };
    if (userId) {
      log.info(`loading a saved rating (if it exists) for user ${userId}`);
      loadSavedReview({
        apiState,
        userId,
        addonId: addon.id,
        versionId: version.id,
      });
    }
  }

  onSelectRating = (rating: number) => {
    const { userReview, version } = this.props;

    const params = {
      errorHandler: this.props.errorHandler,
      rating,
      apiState: this.props.apiState,
      addonId: this.props.addon.id,
      reviewId: undefined,
      versionId: version.id,
    };

    if (userReview) {
      log.info(`Editing reviewId ${userReview.id}`);
      if (userReview.versionId === params.versionId) {
        log.info(oneLine`Updating reviewId ${userReview.id} for
          versionId ${params.versionId || '[empty]'}`);
        params.reviewId = userReview.id;
      } else {
        // Since we have a version mismatch, submit the review against the
        // current most version, similar to how new reviews are created.
        params.versionId =
          this.props.addon.current_version &&
          this.props.addon.current_version.id;
        log.info(oneLine`Submitting a new review for
          versionId ${params.versionId || '[empty]'}`);
      }
    } else {
      log.info(oneLine`Submitting a new review for
        versionId ${params.versionId || '[empty]'}`);
    }
    return this.props.submitReview(params).then(() => {
      this.setState({ showTextEntry: true });
    });
  };

  getLogInPrompt(
    { addonType }: {| addonType: string |},
    {
      validAddonTypes = defaultValidAddonTypes,
    }: {|
      validAddonTypes: typeof defaultValidAddonTypes,
    |} = {},
  ) {
    const { i18n } = this.props;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        return i18n.gettext('Log in to rate this dictionary');
      case ADDON_TYPE_LANG:
        return i18n.gettext('Log in to rate this language pack');
      case ADDON_TYPE_OPENSEARCH:
        return i18n.gettext('Log in to rate this search plugin');
      case ADDON_TYPE_STATIC_THEME:
      case ADDON_TYPE_THEME:
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

  renderLogInToRate() {
    const { AuthenticateButton, addon, location } = this.props;
    return (
      <div className="RatingManager-log-in-to-rate">
        <AuthenticateButton
          noIcon
          className="RatingManager-log-in-to-rate-button"
          location={location}
          logInText={this.getLogInPrompt({ addonType: addon.type })}
        />
      </div>
    );
  }

  onReviewSubmitted = () => {
    this.setState({ showTextEntry: false });
    if (this.props.onReviewSubmitted) {
      this.props.onReviewSubmitted();
    }
  };

  render() {
    const {
      AddonReview,
      UserRating,
      ReportAbuseButton,
      i18n,
      addon,
      userId,
      userReview,
    } = this.props;
    const { showTextEntry } = this.state;
    const isLoggedIn = Boolean(userId);

    const prompt = i18n.sprintf(
      i18n.gettext('How are you enjoying your experience with %(addonName)s?'),
      { addonName: addon.name },
    );

    return (
      <div className="RatingManager">
        {showTextEntry && isLoggedIn ? (
          <AddonReview
            onReviewSubmitted={this.onReviewSubmitted}
            review={userReview}
          />
        ) : null}
        <form action="">
          <fieldset>
            <legend
              ref={(ref) => {
                this.ratingLegend = ref;
              }}
            >
              {prompt}
            </legend>
            {!isLoggedIn ? this.renderLogInToRate() : null}
            <UserRating
              readOnly={!isLoggedIn}
              onSelectRating={this.onSelectRating}
              review={userReview}
            />
          </fieldset>
        </form>
        <ReportAbuseButton addon={addon} />
      </div>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const userId = state.users.currentUserID;
  let userReview;

  // Look for the latest saved review by this user for this add-on.
  if (userId && state.reviews && ownProps.addon) {
    log.info(oneLine`Checking state for review by user ${userId},
      addonId ${ownProps.addon.id}, versionId ${ownProps.version.id}`);

    const allUserReviews = state.reviews[userId] || {};
    const addonReviews = allUserReviews[ownProps.addon.id] || {};
    const latestId = Object.keys(addonReviews).find(
      (reviewId) => addonReviews[reviewId].isLatest,
    );

    if (latestId) {
      userReview = addonReviews[latestId];
      log.info(
        'Found the latest review in state for this component',
        userReview,
      );
    }
  }

  return {
    apiState: state.api,
    userReview,
    userId,
  };
};

export const mapDispatchToProps = (
  dispatch: DispatchFunc,
): DispatchMappedProps => ({
  loadSavedReview({ apiState, userId, addonId, versionId }) {
    return getLatestUserReview({
      apiState,
      user: userId,
      addon: addonId,
      version: versionId,
    }).then((review) => {
      if (review) {
        dispatch(setReview(review));
      } else {
        log.info(
          `No saved review found for userId ${userId}, addonId ${addonId}`,
        );
      }
    });
  },

  submitReview(params) {
    return submitReview(params).then((review) => dispatch(setReview(review)));
  },
});

export const RatingManagerWithI18n = translate()(RatingManagerBase);

const RatingManager: React.ComponentType<Props> = compose(
  withRenderedErrorHandler({ name: 'RatingManager' }),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(RatingManagerWithI18n);

export default RatingManager;
