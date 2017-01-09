import React, { PropTypes } from 'react';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';
import { connect } from 'react-redux';

import Rating from 'ui/components/Rating';
import { setAddonReviews } from 'amo/actions/reviews';
import { callApi } from 'core/api';
import translate from 'core/i18n/translate';
import { findAddon, loadAddonIfNeeded } from 'core/utils';

import 'amo/css/AddonReviewList.scss';


export class AddonReviewListBase extends React.Component {
  static propTypes = {
    apiState: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    initialData: PropTypes.object,
    router: PropTypes.object.isRequired,
  }

  goBackToAddonDetail = () => {
    const { router } = this.props;
    const { addon } = this.props.initialData;
    const { lang, clientApp } = this.props.apiState;
    router.push(`/${lang}/${clientApp}/addon/${addon.slug}/`);
  }

  renderReview(review) {
    const { addon } = this.props.initialData;
    // FIXME: get actual review version.
    const version = addon.current_version;
    return (
      <li className="AddonReviewList-li">
        <h3>{review.title}</h3>
        <p>
          {review.body}
        </p>
        <span>
          <Rating rating={review.rating} readOnly />
          {this.props.i18n.gettext('from')} {review.userName}
        </span>
      </li>
    );
  }

  render() {
    const { i18n, initialData } = this.props;
    console.log('Rendering AddonReviewListBase');
    if (!initialData) {
      return <div>{i18n.gettext('Loading...')}</div>;
    }

    const { reviews, addon } = initialData;
    const subTitle = i18n.sprintf(
      i18n.gettext('for %(addonName)s'), { addonName: addon.name });
    console.log('AddonReviewList reviews', reviews);
    const allReviews = reviews || [];

    return (
      <div className="AddonReviewList">
        <div className="AddonReviewList-header">
          <img src={addon.icon_url} alt="" />
          <h2>{i18n.gettext('All written reviews')}</h2>
          <h4>{subTitle}</h4>
        </div>
        <ul className="AddonReviewList-ul">
          {allReviews.map((review) => this.renderReview(review))}
        </ul>
      </div>
    );
  }
}

export const mapStateToProps = (state) => ({
  apiState: state.api,
});

function loadAddonReviews({ addonSlug, dispatch }) {
  return callApi({
    endpoint: `addons/addon/${addonSlug}/reviews`,
    method: 'GET',
  })
    .then((response) => {
      // TODO: ignore reviews with null bodies as those
      // are legitimately incomplete.
      const action = setAddonReviews(
        { addonSlug, reviews: response.results });
      dispatch(action);
      return action.payload.reviews;
    });
}

export function loadInitialData({ store, params }) {
  const { slug } = params;
  return new Promise((resolve) => {
    if (!slug) {
      throw new Error('missing URL param slug (add-on slug)');
    }
    resolve();
  })
    .then(() => Promise.all([
      loadAddonIfNeeded({ store, params }),
      loadAddonReviews({ addonSlug: slug, dispatch: store.dispatch }),
    ]))
    .then((results) => {
      const reviews = results[1];
      const addon = findAddon(store.getState(), slug);
      const initialData = { addon, reviews };
      return initialData;
    });
}

export default compose(
  asyncConnect([{
    key: 'initialData',
    deferred: true,
    promise: loadInitialData,
  }]),
  withRouter,
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonReviewListBase);
