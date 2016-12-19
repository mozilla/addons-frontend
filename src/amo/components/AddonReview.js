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

  onSubmit = (event) => {
    event.preventDefault();
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

  goBackToAddonDetail = () => {
    const { router } = this.props;
    const { addonSlug } = this.props.review;
    const { lang, clientApp } = this.props.apiState;
    router.push(`/${lang}/${clientApp}/addon/${addonSlug}/`);
  }

  render() {
    const { i18n, review } = this.props;
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
      <div className="AddonReview">
        <h2 className="AddonReview-header">{i18n.gettext('Write a review')}</h2>
        <p ref={(ref) => { this.reviewPrompt = ref; }}>{prompt}</p>
        <form onSubmit={this.onSubmit} ref={(ref) => { this.reviewForm = ref; }}>
          <textarea
            className="AddonReview-textarea"
            ref={(ref) => { this.reviewTextarea = ref; }}
            name="review"
            placeholder={placeholder}>
            {review.body}
          </textarea>
          <div className="AddonReview-button-row">
            <button className="AddonReview-button AddonReview-back-button"
              onClick={this.goBackToAddonDetail}
              ref={(ref) => { this.backButton = ref; }}>
              {i18n.gettext('Back')}
            </button>
            <input
              className="AddonReview-button AddonReview-submit-button"
              type="submit" value={i18n.gettext('Submit')}
            />
          </div>
        </form>
      </div>
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

export function loadAddonReview(
  { store: { dispatch }, params: { slug, reviewId } }
) {
  return new Promise((resolve) => {
    if (!slug || !reviewId) {
      throw new Error('missing URL params slug (add-on slug) or reviewId');
    }
    resolve(callApi({
      endpoint: `addons/addon/${slug}/reviews/${reviewId}`,
      method: 'GET',
    }));
  })
    .then((review) => {
      const action = setReview(review);
      dispatch(action);
      return action.payload;
    });
}

export default compose(
  asyncConnect([{
    key: 'review',
    deferred: true,
    promise: loadAddonReview,
  }]),
  withErrorHandling({ name: 'AddonReview' }),
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true }),
)(AddonReviewBase);
