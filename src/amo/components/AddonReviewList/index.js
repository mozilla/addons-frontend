/* @flow */
/* eslint-disable react/sort-comp, react/no-unused-prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonReviewListItem from 'amo/components/AddonReviewListItem';
import { fetchReviews } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import { expandReviewObjects } from 'amo/reducers/reviews';
import { fetchAddon } from 'core/reducers/addons';
import Paginate from 'core/components/Paginate';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { findAddon, parsePage } from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import log from 'core/logger';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { UserReviewType } from 'amo/actions/reviews';
import type { ReviewState } from 'amo/reducers/reviews';
import type { UserStateType } from 'core/reducers/user';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  i18n: I18nType,
  addon?: AddonType,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  location: ReactRouterLocation,
  params: {| addonSlug: string |},
  reviewCount?: number,
  reviews?: Array<UserReviewType>,
|};

export class AddonReviewListBase extends React.Component<Props> {
  componentWillMount() {
    this.loadDataIfNeeded();
  }

  componentWillReceiveProps(nextProps: Props) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(nextProps?: Props) {
    const lastAddon = this.props.addon;
    const nextAddon = nextProps && nextProps.addon;
    const {
      addon, dispatch, errorHandler, params, reviews,
    } = {
      ...this.props,
      ...nextProps,
    };

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    if (!addon) {
      dispatch(fetchAddon({ slug: params.addonSlug, errorHandler }));
    } else if (
      // This is the first time rendering the component.
      !nextProps ||
      // The component is getting updated with a new addon type.
      (nextAddon && lastAddon && nextAddon.type !== lastAddon.type)
    ) {
      dispatch(setViewContext(addon.type));
    }

    let location = this.props.location;
    let locationChanged = false;
    if (nextProps && nextProps.location) {
      if (nextProps.location !== location) {
        locationChanged = true;
      }
      location = nextProps.location;
    }

    if (!reviews || locationChanged) {
      dispatch(fetchReviews({
        addonSlug: params.addonSlug,
        errorHandlerId: errorHandler.id,
        page: parsePage(location.query.page),
      }));
    }
  }

  addonURL() {
    const { addon } = this.props;
    if (!addon) {
      throw new Error('cannot access addonURL() with a falsey addon property');
    }
    return `/addon/${addon.slug}/`;
  }

  url() {
    return `${this.addonURL()}reviews/`;
  }

  render() {
    const {
      addon, errorHandler, location, params, i18n, reviewCount, reviews,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);
      // The following code attempts to recover from a 401 returned
      // by fetchAddon() but may accidentally catch a 401 from
      // fetchReviews(). Oh well.
      // TODO: support multiple error handlers, see
      // https://github.com/mozilla/addons-frontend/issues/3101
      //
      // 401 and 403 are for an add-on lookup is made to look like a 404 on purpose.
      // See https://github.com/mozilla/addons-frontend/issues/3061
      if (errorHandler.capturedError.responseStatusCode === 401 ||
          errorHandler.capturedError.responseStatusCode === 403 ||
          errorHandler.capturedError.responseStatusCode === 404
      ) {
        return <NotFound />;
      }
    }

    if (!params.addonSlug) {
      throw new Error('params.addonSlug cannot be falsey');
    }

    // When reviews have not loaded yet, make a list of 4 empty reviews
    // as a placeholder.
    const allReviews = reviews || Array(4).fill(null);
    const iconUrl = getAddonIconUrl(addon);
    const iconImage = (
      <img src={iconUrl} alt={i18n.gettext('Add-on icon')} />
    );

    let header;
    if (addon) {
      header = i18n.sprintf(
        i18n.gettext('Reviews for %(addonName)s'), { addonName: addon.name });
    } else {
      header = <LoadingText />;
    }

    let addonName;
    if (addon) {
      addonName = <Link to={this.addonURL()}>{addon.name}</Link>;
    } else {
      addonName = <LoadingText />;
    }

    return (
      <div className="AddonReviewList">
        {errorHandler.renderErrorIfPresent()}
        <div className="AddonReviewList-header">
          <div className="AddonReviewList-header-icon">
            {addon ? <Link to={this.addonURL()}>{iconImage}</Link> : iconImage}
          </div>
          <div className="AddonReviewList-header-text">
            <h1 className="visually-hidden">{header}</h1>
            <h2>{i18n.gettext('All written reviews')}</h2>
            <h3>{addonName}</h3>
          </div>
        </div>
        <CardList>
          <ul>
            {allReviews.map((review, index) => {
              return (
                <li key={String(index)}>
                  <AddonReviewListItem
                    addon={addon}
                    location={location}
                    review={review}
                  />
                </li>
              );
            })}
          </ul>
        </CardList>
        {addon && reviewCount ?
          <Paginate
            LinkComponent={Link}
            count={reviewCount}
            currentPage={parsePage(location.query.page)}
            pathname={this.url()}
          />
          : null
        }
      </div>
    );
  }
}

export function mapStateToProps(
  state: {| user: UserStateType, reviews: ReviewState |},
  ownProps: Props,
) {
  if (!ownProps || !ownProps.params || !ownProps.params.addonSlug) {
    throw new Error('The component had a falsey params.addonSlug parameter');
  }
  const addonSlug = ownProps.params.addonSlug;
  const reviewData = state.reviews.byAddon[addonSlug];

  return {
    addon: findAddon(state, addonSlug),
    reviewCount: reviewData && reviewData.reviewCount,
    reviews: reviewData && expandReviewObjects({
      state: state.reviews,
      reviews: reviewData.reviews,
    }),
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
  withErrorHandler({ name: 'AddonReviewList' }),
)(AddonReviewListBase);
