import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setReview } from 'amo/actions/reviews';
import { postRating } from 'amo/api';
import translate from 'core/i18n/translate';
import log from 'core/logger';

import 'amo/css/OverallRating.scss';


export class OverallRatingBase extends React.Component {
  static propTypes = {
    addonName: PropTypes.string.isRequired,
    addonId: PropTypes.number.isRequired,
    apiState: PropTypes.object,
    version: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    createRating: PropTypes.func.isRequired,
    userId: PropTypes.number,
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
      userId: this.props.userId,
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
              <button value={5} onClick={this.onClickRating}
                className="OverallRating-choice OverallRating-rating-5" id="OverallRating-rating-5">
                {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
                {i18n.gettext('Love it!')}
              </button>
              <button value={3} onClick={this.onClickRating}
                className="OverallRating-choice OverallRating-rating-3" id="OverallRating-rating-3">
                {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
                {i18n.gettext("It's OK")}
              </button>
              <button value={1} onClick={this.onClickRating}
                className="OverallRating-choice OverallRating-rating-1" id="OverallRating-rating-1">
                {/* L10n: This should be a very short phrase for layout reasons, if possible. */}
                {i18n.gettext('Huh?')}
              </button>
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
  createRating({ addonId, userId, ...params }) {
    return postRating({ addonId, ...params })
      .then((review) => {
        // TODO: when we have a user_id in the API response, we
        // could probably use that instead.
        // https://github.com/mozilla/addons-server/issues/3672
        dispatch(setReview({
          addonId,
          rating: review.rating,
          versionId: review.version.id,
          userId,
        }));
      });
  },
});

export const OverallRatingWithI18n = compose(
  translate({ withRef: true }),
)(OverallRatingBase);

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(OverallRatingWithI18n);
