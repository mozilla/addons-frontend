import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { withRouter } from 'react-router';

import { submitReview } from 'amo/api';
import { setReview } from 'amo/actions/reviews';
import { callApi } from 'core/api';
import { withErrorHandling } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import OverlayCard from 'ui/components/OverlayCard';

import 'amo/css/AddonReview.scss';


export class AddonReviewBase extends React.Component {
  static propTypes = {
    apiState: PropTypes.object,
    errorHandler: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    review: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    updateReviewText: PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.overlayCard = null;
  }

  onSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const body = this.reviewTextarea.value;
    const params = {
      body,
      addonSlug: this.props.review.addonSlug,
      errorHandler: this.props.errorHandler,
      reviewId: this.props.review.id,
      apiState: this.props.apiState,
      router: this.props.router,
    };
    // TODO: render a progress indicator in the UI.
    return this.props.updateReviewText(params)
      .then(() => this.goBackToAddonDetail());
  }

  // TODO: delete this and add a click-outside event.
  goBackToAddonDetail = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // TODO: switch to redux actions maybe.
    this.overlayCard.hide();
  }

  render() {
    const { i18n, review } = this.props;
    console.log('review property, nice?', review);
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

    const titlePlaceholder = i18n.gettext('Give your review a title');

    return (
      <OverlayCard ref={(ref) => { this.overlayCard = ref; }}
        visibleOnLoad={true} className="AddonReview">
        <h2 className="AddonReview-header">{i18n.gettext('Write a review')}</h2>
        <p ref={(ref) => { this.reviewPrompt = ref; }}>{prompt}</p>
        <form onSubmit={this.onSubmit} ref={(ref) => { this.reviewForm = ref; }}>
          <div className="AddonReview-form-input">
            <input className="AddonReview-title" name="reviewTitle"
              placeholder={titlePlaceholder} />
            <textarea
              className="AddonReview-textarea"
              ref={(ref) => { this.reviewTextarea = ref; }}
              name="review"
              placeholder={placeholder}>
              {review.body}
            </textarea>
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
  withErrorHandling({ name: 'AddonReview' }),
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true }),
)(AddonReviewBase);
