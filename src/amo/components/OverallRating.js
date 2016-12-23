import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';

import { withErrorHandling } from 'core/errorHandler';
import { setReview } from 'amo/actions/reviews';
import { getLatestUserReview, submitReview } from 'amo/api';
import translate from 'core/i18n/translate';
import log from 'core/logger';

import 'amo/css/OverallRating.scss';


export class OverallRatingBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    errorHandler: PropTypes.func.isRequired,
    apiState: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    loadSavedReview: PropTypes.func.isRequired,
    readOnly: PropTypes.boolean,
    router: PropTypes.object.isRequired,
    submitReview: PropTypes.func.isRequired,
    userId: PropTypes.number,
    userReview: PropTypes.object,
    version: PropTypes.object.isRequired,
  }

  static defaultProps = {
    readOnly: false,
  }

  constructor(props) {
    super(props);
    const { loadSavedReview, userId, addon } = props;
    this.ratingButtons = {};
    if (userId) {
      log.info(`loading a saved rating (if it exists) for user ${userId}`);
      loadSavedReview({ userId, addonId: addon.id });
    }
  }

  onClickRating = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    log.debug('Selected rating from form button:', button.value);
    const { userReview, userId, version } = this.props;

    const params = {
      errorHandler: this.props.errorHandler,
      rating: parseInt(button.value, 10),
      apiState: this.props.apiState,
      addonId: this.props.addon.id,
      addonSlug: this.props.addon.slug,
      router: this.props.router,
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
    this.props.submitReview(params);
  }

  renderRatings() {
    const { readOnly, userReview } = this.props;
    return [1, 2, 3, 4, 5].map((rating) =>
      <button
        className={classNames('OverallRating-choice', {
          'OverallRating-selected-star':
            userReview && rating <= userReview.rating,
        })}
        disabled={readOnly}
        ref={(ref) => { this.ratingButtons[rating] = ref; }}
        value={rating}
        onClick={readOnly ? null : this.onClickRating}
        id={`OverallRating-rating-${rating}`}
      />
    );
  }

  render() {
    const { readOnly, i18n, addon } = this.props;

    // TODO: Disable rating ability when not logged in
    // (when props.userId is empty)

    const starRatings = (
      <div className="OverallRating-choices">
        <span className="OverallRating-star-group">
          {this.renderRatings()}
        </span>
      </div>
    );

    let ratingContainer;
    if (readOnly) {
      ratingContainer = starRatings;
    } else {
      const prompt = i18n.sprintf(
        i18n.gettext('How are you enjoying your experience with %(addonName)s?'),
        { addonName: addon.name });

      ratingContainer = (
        <form action="">
          <fieldset>
            <legend ref={(ref) => { this.ratingLegend = ref; }}>
              {prompt}
            </legend>
            {starRatings}
          </fieldset>
        </form>
      );
    }

    const cls = classNames('OverallRating', {
      'OverallRating--editable': !readOnly,
    });

    return (
      <div className={cls} ref={(ref) => { this.element = ref; }}>
        {ratingContainer}
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
  withErrorHandling({ name: 'OverallRating' }),
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(OverallRatingWithI18n);
