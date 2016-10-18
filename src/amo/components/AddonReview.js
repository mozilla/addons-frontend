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
    updateReviewText: PropTypes.func.isRequired,
  }

  onSubmit = (event) => {
    event.preventDefault();
    const body = this.reviewTextarea.value;
    if (!body) {
      // TODO: dispatch an error action when we have support for that.
      throw new Error('The review text cannot be empty');
    }
    const params = {
      body,
      addonSlug: this.props.review.addonSlug,
      reviewId: this.props.review.id,
      apiState: this.props.apiState,
      router: this.props.router,
    };
    // TODO: render a progress indicator in the UI.
    this.props.updateReviewText(params);
  }

  render() {
    const { i18n, review } = this.props;
    if (!review || !review.id || !review.addonSlug) {
      throw new Error(`Unexpected review property: ${JSON.stringify(review)}`);
    }

    console.log('Do we have a router?', this.props.router);

    // TODO: I guess we should load the existing review text so it
    // can be edited? That flow needs more thought.
    return (
      <div className="AddonReview">
        <h2>{i18n.gettext('Write a review')}</h2>
        <p>
          {i18n.gettext(
            'Tell the world why you think this extension is fantastic!'
          )}
        </p>
        <form onSubmit={this.onSubmit}>
          <textarea
            ref={(ref) => { this.reviewTextarea = ref; }}
            name="review"
            placeholder={i18n.gettext(
              'Tell us what you love about this extension. ' +
              'Be specific and concise.')} />
          <div className="AddonReview-button-row">
            {/* TODO: hook up the back button when we have link support */}
            <button className="AddonReview-button AddonReview-back-button">
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

export const mapDispatchToProps = (/* dispatch */) => ({
  updateReviewText({ router, addonSlug, ...params }) {
    return submitReview({ addonSlug, ...params })
      .then(() => {
        const { lang, clientApp } = params.apiState;
        router.push(`/${lang}/${clientApp}/addon/${addonSlug}/`);
      });
  },
});

export function loadAddonReview(
  { store: { dispatch }, params: { slug, reviewId } }
) {
  return new Promise(
    (resolve) => {
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
        addonId: review.addon.id,
        versionId: review.version.id,
        rating: review.rating,
        userId: review.user.id,
      }));

      const reviewData = {
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
  connect(mapStateToProps, mapDispatchToProps),
  translate({ withRef: true }),
)(AddonReviewBase);
