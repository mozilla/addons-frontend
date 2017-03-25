/* @flow */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { ErrorHandler, withErrorHandling } from 'core/errorHandler';
import { setReview } from 'amo/actions/reviews';
import type { UserReviewType } from 'amo/actions/reviews';
import { getLatestUserReview, submitReview } from 'amo/api';
import type { SubmitReviewParams } from 'amo/api';
import DefaultAddonReview from 'amo/components/AddonReview';
import type { DispatchFn } from 'core/types/reduxTypes';
import type { AddonType, AddonTypeProp, AddonVersionType }
  from 'core/types/addonTypes';
import DefaultAuthenticateButton from 'core/components/AuthenticateButton';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_SEARCH,
  ADDON_TYPE_THEME,
  validAddonTypes as defaultValidAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import DefaultRating from 'ui/components/Rating';

import './styles.scss';

type GetLogInPromptParams = {| addonType: AddonTypeProp |};

type GetLogInPromptOptions = {|
  validAddonTypes: typeof defaultValidAddonTypes,
|};

type RatingManagerProps = {|
  AddonReview: typeof DefaultAddonReview,
  AuthenticateButton: typeof DefaultAuthenticateButton,
  Rating: typeof DefaultRating,
  addon: AddonType,
  errorHandler: typeof ErrorHandler,
  apiState: Object,
  i18n: Object,
  loadSavedReview: (LoadSavedReviewParams) => void,
  location: Object, // might be builtin
  submitReview: (SubmitReviewParams) => Promise<void>,
  userId: number,
  userReview: UserReviewType,
  version: AddonVersionType,
|};

export class RatingManagerBase extends React.Component {
  props: RatingManagerProps;
  ratingLegend: Node;
  state: {|
    showTextEntry: boolean,
  |};

  static defaultProps = {
    AddonReview: DefaultAddonReview,
    AuthenticateButton: DefaultAuthenticateButton,
    Rating: DefaultRating,
  }

  constructor(props: RatingManagerProps) {
    super(props);
    const { loadSavedReview, userId, addon } = props;
    this.state = { showTextEntry: false };
    if (userId) {
      log.info(`loading a saved rating (if it exists) for user ${userId}`);
      loadSavedReview({ userId, addonId: addon.id });
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
        log.info(
          `Updating reviewId ${userReview.id} for versionId ${params.versionId}`);
        params.reviewId = userReview.id;
      } else {
        // Since we have a version mismatch, submit the review against the
        // current most version, similar to how new reviews are created.
        params.versionId = this.props.addon.current_version.id;
        log.info(`Submitting a new review for versionId ${params.versionId}`);
      }
    } else {
      log.info(`Submitting a new review for versionId ${params.versionId}`);
    }
    return this.props.submitReview(params)
      .then(() => {
        this.setState({ showTextEntry: true });
      });
  }

  getLogInPrompt(
    { addonType }: GetLogInPromptParams,
    { validAddonTypes = defaultValidAddonTypes }: GetLogInPromptOptions = {}
  ) {
    const { i18n } = this.props;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        return i18n.gettext('Log in to rate this dictionary');
      case ADDON_TYPE_LANG:
        return i18n.gettext('Log in to rate this language pack');
      case ADDON_TYPE_SEARCH:
        return i18n.gettext('Log in to rate this search engine');
      case ADDON_TYPE_THEME:
        return i18n.gettext('Log in to rate this theme');
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('Log in to rate this extension');
      default:
        if (!validAddonTypes.includes(addonType)) {
          throw new Error(`Unknown extension type: ${addonType}`);
        }
        log.warn(`Using generic prompt for add-on type: ${addonType}`);
        return i18n.gettext('Log in to rate this add-on');
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

  render() {
    const { AddonReview, Rating, i18n, addon, userId, userReview } = this.props;
    const { showTextEntry } = this.state;
    const isLoggedIn = Boolean(userId);

    const prompt = i18n.sprintf(
      i18n.gettext('How are you enjoying your experience with %(addonName)s?'),
      { addonName: addon.name });

    const onReviewSubmitted = () => {
      this.setState({ showTextEntry: false });
    };

    return (
      <div className="RatingManager">
        {showTextEntry ?
          <AddonReview
            onReviewSubmitted={onReviewSubmitted}
            review={userReview}
          /> : null
        }
        <form action="">
          <fieldset>
            <legend ref={(ref) => { this.ratingLegend = ref; }}>
              {prompt}
            </legend>
            {!isLoggedIn ? this.renderLogInToRate() : null}
            <Rating
              readOnly={!isLoggedIn}
              onSelectRating={this.onSelectRating}
              rating={userReview ? userReview.rating : undefined}
            />
          </fieldset>
        </form>
      </div>
    );
  }
}

export const mapStateToProps = (
  state: Object, ownProps: RatingManagerProps
) => {
  const userId = state.auth && state.auth.userId;
  let userReview;

  // Look for the latest saved review by this user for this add-on.
  if (userId && state.reviews && ownProps.addon) {
    log.info(dedent`Checking state for review by user ${userId},
      addonId ${ownProps.addon.id}, versionId ${ownProps.version.id}`);

    const allUserReviews = state.reviews[userId] || {};
    const addonReviews = allUserReviews[ownProps.addon.id] || {};
    const latestId = Object.keys(addonReviews).find(
      (reviewId) => addonReviews[reviewId].isLatest);

    if (latestId) {
      userReview = addonReviews[latestId];
      log.info('Found the latest review in state for this component',
               userReview);
    }
  }

  return {
    apiState: state.api,
    userReview,
    userId,
  };
};

type LoadSavedReviewParams = {|
  userId: number,
  addonId: number,
|};

export const mapDispatchToProps = (dispatch: DispatchFn) => ({

  loadSavedReview({ userId, addonId }: LoadSavedReviewParams) {
    return getLatestUserReview({ user: userId, addon: addonId })
      .then((review) => {
        if (review) {
          dispatch(setReview(review));
        } else {
          log.info(
            `No saved review found for userId ${userId}, addonId ${addonId}`);
        }
      });
  },

  submitReview(params: SubmitReviewParams) {
    return submitReview(params).then((review) => dispatch(setReview(review)));
  },
});

export const RatingManagerWithI18n = compose(
  translate({ withRef: true }),
)(RatingManagerBase);

export default compose(
  withErrorHandling({ name: 'RatingManager' }),
  connect(mapStateToProps, mapDispatchToProps),
)(RatingManagerWithI18n);
