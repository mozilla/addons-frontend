import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { withRouter } from 'react-router';

import { submitReview } from 'amo/api';
import { setReview } from 'amo/actions/reviews';
import { callApi } from 'core/api';
import translate from 'core/i18n/translate';

import 'amo/css/AddonReview.scss';


export class AddonReviewBase extends React.Component {
  static propTypes = {
    apiState: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    review: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    updateReviewText: PropTypes.func,
  }

  static defaultProps = {
    // TODO: move this to mapDispatchToProps once we need to pass dispatch()
    // to callApi()
    updateReviewText: (...params) => submitReview(...params),
  }

  constructor(props) {
    super(props);
    this.state = { errorMessage: null };
  }

  onSubmit = (event) => {
    event.preventDefault();
    this.clearErrors();
    const body = this.reviewTextarea.value;
    if (!body) {
      this.setState({
        errorMessage: this.props.i18n.gettext(
          'Please enter some text'
        ),
      });
      return Promise.reject();
    }
    const params = {
      body,
      addonSlug: this.props.review.addonSlug,
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

  clearErrors() {
    this.setState({ errorMessage: null });
  }

  render() {
    const { i18n, review } = this.props;
    if (!review || !review.id || !review.addonSlug) {
      throw new Error(`Unexpected review property: ${JSON.stringify(review)}`);
    }

    let errorMessage;
    if (this.state.errorMessage) {
      errorMessage = (
        <div className="AddonReview-error"
             ref={(ref) => { this.errorMessage = ref; }}>
          {this.state.errorMessage}
        </div>
      );
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

    // TODO: I guess we should load the existing review text so it
    // can be edited? That flow needs more thought.
    return (
      <div className="AddonReview">
        <h2 className="AddonReview-header">{i18n.gettext('Write a review')}</h2>
        <p ref={(ref) => { this.reviewPrompt = ref; }}>{prompt}</p>
        {errorMessage}
        <form onSubmit={this.onSubmit} ref={(ref) => { this.reviewForm = ref; }}>
          <textarea
            className="AddonReview-textarea"
            ref={(ref) => { this.reviewTextarea = ref; }}
            name="review"
            placeholder={placeholder} />
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
      dispatch(setReview({
        id: review.id,
        addonId: review.addon.id,
        versionId: review.version.id,
        rating: review.rating,
        userId: review.user.id,
        isLatest: review.is_latest,
      }));

      const reviewData = {
        rating: review.rating,
        addonSlug: slug,
        id: review.id,
      };
      return reviewData;
    });
}

export default compose(
  asyncConnect([{
    key: 'review',
    deferred: true,
    promise: loadAddonReview,
  }]),
  withRouter,
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonReviewBase);
