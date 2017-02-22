import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { withErrorHandling } from 'core/errorHandler';
import { setReview } from 'amo/actions/reviews';
import { getLatestUserReview, submitReview } from 'amo/api';
import DefaultAddonReview from 'amo/components/AddonReview';
import DefaultAuthenticateButton from 'core/components/AuthenticateButton';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import DefaultRating from 'ui/components/Rating';

import './styles.scss';


export class RatingManagerBase extends React.Component {
  static propTypes = {
    AddonReview: PropTypes.node,
    AuthenticateButton: PropTypes.node,
    addon: PropTypes.object.isRequired,
    errorHandler: PropTypes.func.isRequired,
    apiState: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    loadSavedReview: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
    Rating: PropTypes.node,
    submitReview: PropTypes.func.isRequired,
    userId: PropTypes.number,
    userReview: PropTypes.object,
    version: PropTypes.object.isRequired,
  }

  static defaultProps = {
    AddonReview: DefaultAddonReview,
    AuthenticateButton: DefaultAuthenticateButton,
    Rating: DefaultRating,
  }

  constructor(props) {
    super(props);
    const { loadSavedReview, userId, addon } = props;
    this.state = { showTextEntry: false };
    if (userId) {
      log.info(`loading a saved rating (if it exists) for user ${userId}`);
      loadSavedReview({ userId, addonId: addon.id });
    }
  }

  onSelectRating = (rating) => {
    const { userId, userReview, version } = this.props;

    const params = {
      errorHandler: this.props.errorHandler,
      rating,
      apiState: this.props.apiState,
      addonId: this.props.addon.id,
      versionId: version.id,
      userId,
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

  renderLogInToRate() {
    const { AuthenticateButton, addon, i18n, location } = this.props;
    let authPrompt;
    if (addon.type === ADDON_TYPE_EXTENSION) {
      authPrompt = i18n.gettext('Log in to rate this extension');
    } else if (addon.type === ADDON_TYPE_THEME) {
      authPrompt = i18n.gettext('Log in to rate this theme');
    } else {
      throw new Error(`Unknown extension type: ${addon.type}`);
    }
    return (
      <div className="RatingManager-log-in-to-rate">
        <AuthenticateButton
          noIcon
          className="RatingManager-log-in-to-rate-button"
          location={location}
          logInText={authPrompt}
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

export const mapStateToProps = (state, ownProps) => {
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

export const mapDispatchToProps = (dispatch) => ({

  loadSavedReview({ userId, addonId }) {
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

  submitReview(params) {
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
