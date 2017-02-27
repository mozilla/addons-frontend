import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Rating from 'ui/components/Rating';
import { setAddonReviews } from 'amo/actions/reviews';
import { getReviews } from 'amo/api';
import translate from 'core/i18n/translate';
import { findAddon, loadAddonIfNeeded, safeAsyncConnect } from 'core/utils';
import Link from 'amo/components/Link';
import CardList from 'ui/components/CardList';

import 'amo/css/AddonReviewList.scss';


export class AddonReviewListBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    addon: PropTypes.object,
    params: PropTypes.object.isRequired,
    reviews: PropTypes.array,
  }

  addonURL() {
    return `/addon/${this.props.addon.slug}/`;
  }

  renderReview(review) {
    const { i18n } = this.props;
    const timestamp = i18n.moment(review.created).fromNow();
    return (
      <li className="AddonReviewList-li">
        <h3>{review.title}</h3>
        <p>{review.body}</p>
        <div className="AddonReviewList-by-line">
          <Rating size="small" rating={review.rating} readOnly />
          {/* L10n: Example: "from Jose, last week" */}
          {i18n.sprintf(i18n.gettext('from %(authorName)s, %(timestamp)s'),
                        { authorName: review.userName, timestamp })}
        </div>
      </li>
    );
  }

  render() {
    const { addon, params, i18n, reviews } = this.props;
    if (!params.addonSlug) {
      throw new Error('params.addonSlug cannot be falsey');
    }
    if (!reviews) {
      // TODO: add a spinner
      return <div>{i18n.gettext('Loading...')}</div>;
    }

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
            <h1 className="visually-hidden">
              {i18n.sprintf(i18n.gettext('Reviews for %(addonName)s'),
                            { addonName: addon.name })}
            </h1>
            <h2>{i18n.gettext('All written reviews')}</h2>
            <h3><Link to={this.addonURL()}>{addon.name}</Link></h3>
          </div>
        </div>
        <CardList>
          <ul>
            {allReviews.map((review) => this.renderReview(review))}
          </ul>
        </CardList>
      </div>
    );
  }
}

export function loadAddonReviews({ addonId, addonSlug, dispatch }) {
  return getReviews({ addon: addonId })
    .then((allReviews) => {
      // Ignore reviews with null bodies as those are incomplete.
      // For example, the user selected a star rating but hasn't submitted
      // review text yet.
      const reviews = allReviews.filter((review) => Boolean(review.body));
      dispatch(setAddonReviews({ addonSlug, reviews }));
    });
}

export function loadInitialData({ store, params }) {
  const { addonSlug } = params;
  if (!addonSlug) {
    return Promise.reject(new Error('missing URL param addonSlug'));
  }
  return loadAddonIfNeeded({ store, params: { slug: addonSlug } })
    .then(() => findAddon(store.getState(), addonSlug))
    .then((addon) => loadAddonReviews({
      addonId: addon.id, addonSlug, dispatch: store.dispatch,
    }));
}

export function mapStateToProps(state, ownProps) {
  if (!ownProps || !ownProps.params || !ownProps.params.addonSlug) {
    throw new Error('The component had a falsey addonSlug parameter');
  }
  const addonSlug = ownProps.params.addonSlug;
  return {
    addon: findAddon(state, addonSlug),
    reviews: state.reviews.byAddon[addonSlug],
  };
}

export default compose(
  safeAsyncConnect([{ promise: loadInitialData }]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonReviewListBase);
