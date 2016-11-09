import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { setReview } from 'amo/actions/reviews';
import { submitReview } from 'amo/api';
import translate from 'core/i18n/translate';
import log from 'core/logger';

import 'amo/css/OverallRating.scss';


export class OverallRatingBase extends React.Component {
  static propTypes = {
    addonName: PropTypes.string.isRequired,
    addonSlug: PropTypes.string.isRequired,
    addonId: PropTypes.number.isRequired,
    apiState: PropTypes.object,
    createRating: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    userId: PropTypes.number,
    version: PropTypes.object.isRequired,
  }

  onClickRating = (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    log.debug('Selected rating from form button:', button.value);
    this.props.createRating({
      rating: parseInt(button.value, 10),
      versionId: this.props.version.id,
      apiState: this.props.apiState,
      addonId: this.props.addonId,
      addonSlug: this.props.addonSlug,
      userId: this.props.userId,
      router: this.props.router,
    });
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
            <legend>{prompt}</legend>
            <div className="OverallRating-choices">
              <span className="OverallRating-star-group">
                {[1, 2, 3, 4, 5].map((rating) =>
                  <button
                    value={rating} onClick={this.onClickRating}
                    className="OverallRating-choice"
                    id={`OverallRating-rating-${rating}`} />
                )}
              </span>
            </div>
          </fieldset>
        </form>
      </div>
    );
  }
}

export const mapStateToProps = (state) => ({
  apiState: state.api,
  userId: state.auth && state.auth.userId,
});

export const mapDispatchToProps = (dispatch) => ({
  createRating({ router, addonSlug, addonId, userId, ...params }) {
    return submitReview({ addonSlug, ...params })
      .then((review) => {
        const { lang, clientApp } = params.apiState;
        // TODO: when we have a user_id in the API response, we
        // could probably use that instead.
        // https://github.com/mozilla/addons-server/issues/3672
        dispatch(setReview({
          addonId,
          rating: review.rating,
          versionId: review.version.id,
          userId,
        }));
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
