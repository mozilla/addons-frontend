import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';

import { setReview } from 'amo/actions/reviews';
import { getLatestUserReview, submitReview } from 'amo/api';
import translate from 'core/i18n/translate';
import log from 'core/logger';

import 'amo/css/OverallRating.scss';


export class OverallRatingBase extends React.Component {
  static propTypes = {
    addonName: PropTypes.string.isRequired,
    addonSlug: PropTypes.string.isRequired,
    addonId: PropTypes.number.isRequired,
    apiState: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    loadSavedRating: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired,
    submitReview: PropTypes.func.isRequired,
    userId: PropTypes.number,
    userReview: PropTypes.object,
    version: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    const { loadSavedRating, userId, addonId } = props;
    this.ratingButtons = {};
    if (userId) {
      log.info(`loading a saved rating (if it exists) for user ${userId}`);
      loadSavedRating({ userId, addonId });
    }
  }

  onClickRating = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    log.debug('Selected rating from form button:', button.value);
    this.props.submitReview({
      reviewId: this.props.userReview && this.props.userReview.id,
      rating: parseInt(button.value, 10),
      versionId: this.props.version.id,
      apiState: this.props.apiState,
      addonId: this.props.addonId,
      addonSlug: this.props.addonSlug,
      userId: this.props.userId,
      router: this.props.router,
    });
  }

  renderRatings() {
    const { userReview } = this.props;
    return [1, 2, 3, 4, 5].map((rating) =>
      <button
        className={classNames('OverallRating-choice', {
          'OverallRating-selected-star':
            userReview && rating <= userReview.rating,
        })}
        ref={(ref) => { this.ratingButtons[rating] = ref; }}
        value={rating}
        onClick={this.onClickRating}
        id={`OverallRating-rating-${rating}`}
      />
    );
  }

  render() {
    const { i18n, addonName } = this.props;
    const prompt = i18n.sprintf(
      i18n.gettext('How are you enjoying your experience with %(addonName)s?'),
      { addonName });

    // TODO: Disable rating ability when not logged in
    // (when props.userId is empty)

    return (
      <div className="OverallRating">
        <form action="">
          <fieldset>
            <legend ref={(ref) => { this.ratingLegend = ref; }}>
              {prompt}
            </legend>
            <div className="OverallRating-choices">
              <span className="OverallRating-star-group">
                {this.renderRatings()}
              </span>
            </div>
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
  if (userId && state.reviews) {
    log.info(dedent`Checking state for review by user ${userId},
      addonId ${ownProps.addonId}, versionId ${ownProps.version.id}`);

    const allUserReviews = state.reviews[userId] || {};
    const addonReviews = allUserReviews[ownProps.addonId] || {};
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

  loadSavedRating({ userId, addonId }) {
    return getLatestUserReview({ userId, addonId })
      .then((review) => {
        if (review) {
          dispatch(setReview(review));
        } else {
          log.info(
            `No saved review found for userId ${userId}, addonId ${addonId}`);
        }
      });
  },

  submitReview({ router, addonSlug, ...params }) {
    return submitReview({ addonSlug, ...params })
      .then((review) => {
        const { lang, clientApp } = params.apiState;
        dispatch(setReview(review));
        router.push(
          `/${lang}/${clientApp}/addon/${addonSlug}/review/${review.id}/`);
      });
  },
});

export const OverallRatingWithI18n = compose(
  translate({ withRef: true }),
)(OverallRatingBase);

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(OverallRatingWithI18n);
