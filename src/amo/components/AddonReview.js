import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { submitReview } from 'amo/api';
import { setReview } from 'amo/actions/reviews';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import OverlayCard from 'ui/components/OverlayCard';

import 'amo/css/AddonReview.scss';


export class AddonReviewBase extends React.Component {
  static propTypes = {
    apiState: PropTypes.object,
    errorHandler: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    review: PropTypes.object.isRequired,
    updateReviewText: PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.state = { reviewBody: null };
    if (props.review) {
      this.state.reviewBody = props.review.body;
    }
    this.overlayCard = null;
    this.reviewTextarea = null;
  }

  componentWillReceiveProps(nextProps) {
    const { review } = nextProps;
    if (review) {
      this.setState({
        reviewBody: review.body,
      });
    }
  }

  onSubmit = (event, { overlayCard = this.overlayCard } = {}) => {
    const { reviewBody } = this.state;
    event.preventDefault();
    event.stopPropagation();
    const params = {
      body: reviewBody,
      addonSlug: this.props.review.addonSlug,
      errorHandler: this.props.errorHandler,
      reviewId: this.props.review.id,
      apiState: this.props.apiState,
    };
    // TODO: render a progress indicator in the UI.
    // https://github.com/mozilla/addons-frontend/issues/1156
    return this.props.updateReviewText(params)
      .then(() => {
        overlayCard.hide();
      });
  }

  onBodyInput = (event) => {
    this.setState({ reviewBody: event.target.value });
  }

  render() {
    const { errorHandler, i18n, review } = this.props;
    const { reviewBody } = this.state;
    if (!review || !review.id || !review.addonSlug) {
      throw new Error(`Unexpected review property: ${JSON.stringify(review)}`);
    }

    let placeholder;
    let prompt;
    if (review.rating && review.rating > 3) {
      prompt = i18n.gettext(
        'Tell the world why you think this extension is fantastic!'
      );
      placeholder = i18n.gettext(
        'Tell us what you love about this extension. Be specific and concise.'
      );
    } else {
      prompt = i18n.gettext('Tell the world about this extension.');
      placeholder = i18n.gettext(
        'Tell us about your experience with this extension. ' +
        'Be specific and concise.'
      );
    }

    return (
      <OverlayCard ref={(ref) => { this.overlayCard = ref; }}
        visibleOnLoad className="AddonReview">
        <h2 className="AddonReview-header">{i18n.gettext('Write a review')}</h2>
        <p ref={(ref) => { this.reviewPrompt = ref; }}>{prompt}</p>
        <form onSubmit={this.onSubmit} ref={(ref) => { this.reviewForm = ref; }}>
          <div className="AddonReview-form-input">
            {errorHandler.hasError() ? errorHandler.renderError() : null}
            <textarea
              ref={(ref) => { this.reviewTextarea = ref; }}
              className="AddonReview-textarea"
              onInput={this.onBodyInput}
              name="review"
              value={reviewBody}
              placeholder={placeholder}
            />
          </div>
          <input
            className="AddonReview-submit"
            type="submit" value={i18n.gettext('Submit review')}
          />
        </form>
      </OverlayCard>
    );
  }
}

export const mapStateToProps = (state) => ({
  apiState: state.api,
});

export const mapDispatchToProps = (dispatch) => ({
  updateReviewText(...params) {
    return submitReview(...params)
      .then((review) => dispatch(setReview(review)));
  },
});

export default compose(
  withErrorHandler({ name: 'AddonReview' }),
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true }),
)(AddonReviewBase);
