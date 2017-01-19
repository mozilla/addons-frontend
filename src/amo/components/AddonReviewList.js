import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';

import Rating from 'ui/components/Rating';
import { setAddonReviews } from 'amo/actions/reviews';
import { getAddonReviews } from 'amo/api';
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
    const { i18n } = this.props;
    const timestamp = i18n.moment(review.created).fromNow();
    return (
      <li className="AddonReviewList-li">
        <h3>{review.title}</h3>
        <p>{review.body}</p>
        <div className="AddonReviewList-by-line">
          <Rating rating={review.rating} readOnly />
          {/* L10n: Example: "from Jose, last week" */}
          {i18n.sprintf(i18n.gettext('from %(authorName)s, %(timestamp)s'),
                        { authorName: review.userName, timestamp })}
        </div>
      </li>
    );
  }

  render() {
    const { i18n, initialData } = this.props;
    if (!initialData) {
      // TODO: add a spinner
      return <div>{i18n.gettext('Loading...')}</div>;
    }

    const { reviews, addon } = initialData;
    const subtitle = i18n.sprintf(
      i18n.gettext('for %(addonName)s'), { addonName: addon.name });
    const allReviews = reviews || [];

    return (
      <div className="AddonReviewList">
        <div className="AddonReviewList-header">
          <div className="AddonReviewList-header-icon">
            <Link to={this.addonURL()}>
              <img src={addon.icon_url} alt={i18n.gettext('Add-on icon')} />
            </Link>
          </div>
          <div className="AddonReviewList-header-text">
            <h2>{i18n.gettext('All written reviews')}</h2>
            <h4><Link to={this.addonURL()}>{subtitle}</Link></h4>
          </div>
        </div>
        <ul className="AddonReviewList-ul">
          {allReviews.map((review) => this.renderReview(review))}
        </ul>
      </div>
    );
  }
}

export function loadAddonReviews({ addonSlug, dispatch }) {
  return getAddonReviews({ addonSlug })
    .then((allReviews) => {
      // Ignore reviews with null bodies as those are incomplete.
      // For example, the user selected a star rating but hasn't submitted
      // review text yet.
      const reviews = allReviews.filter((review) => Boolean(review.body));

      const action = setAddonReviews({ addonSlug, reviews });
      dispatch(action);
      return action.payload.reviews;
    });
}

export function loadInitialData(
  { store, params },
  { _loadAddonReviews = loadAddonReviews } = {},
) {
  const { slug } = params;
  return new Promise((resolve) => {
    if (!slug) {
      throw new Error('missing URL param slug (add-on slug)');
    }
    resolve();
  })
    .then(() => Promise.all([
      _loadAddonReviews({ addonSlug: slug, dispatch: store.dispatch }),
      loadAddonIfNeeded({ store, params }),
    ]))
    .then(([reviews]) => {
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
