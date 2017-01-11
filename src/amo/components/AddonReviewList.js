import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';

import Rating from 'ui/components/Rating';
import { setAddonReviews } from 'amo/actions/reviews';
import { callApi } from 'core/api';
import translate from 'core/i18n/translate';
import { findAddon, loadAddonIfNeeded } from 'core/utils';
import Link from 'amo/components/Link';

import 'amo/css/AddonReviewList.scss';


export class AddonReviewListBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    initialData: PropTypes.object,
  }

  addonURL() {
    const { addon } = this.props.initialData;
    return `/addon/${addon.slug}/`;
  }

  renderReview(review) {
    const { addon } = this.props.initialData;
    return (
      <li className="AddonReviewList-li">
        <h3>{review.title}</h3>
        <p>
          {review.body}
        </p>
        <div className="AddonReview-by-line">
          <Rating rating={review.rating} readOnly />
          {this.props.i18n.gettext('from')} {review.userName},
          {" "}
          {this.props.i18n.moment(review.created).fromNow()}
        </div>
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
          <div className="AddonReviewList-header-icon">
            <Link to={this.addonURL()}>
              <img src={addon.icon_url} alt="" />
            </Link>
          </div>
          <div className="AddonReviewList-header-text">
            <h2>{i18n.gettext('All written reviews')}</h2>
            <h4><Link to={this.addonURL()}>{subTitle}</Link></h4>
          </div>
        </div>
        <ul className="AddonReviewList-ul">
          {allReviews.map((review) => this.renderReview(review))}
        </ul>
      </div>
    );
  }
}

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
  translate({ withRef: true }),
)(AddonReviewListBase);
