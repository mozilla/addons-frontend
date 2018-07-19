/* @flow */
/* eslint-disable react/no-unused-prop-types */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonReviewListItem from 'amo/components/AddonReviewListItem';
import RatingManager from 'amo/components/RatingManager';
import { clearAddonReviews, fetchReviews } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import { expandReviewObjects } from 'amo/reducers/reviews';
import { fetchAddon, getAddonBySlug } from 'core/reducers/addons';
import Paginate from 'core/components/Paginate';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import log from 'core/logger';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Card from 'ui/components/Card';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { UserReviewType } from 'amo/actions/reviews';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterHistoryType,
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  i18n: I18nType,
  addon: AddonType | null,
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  lang: string,
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {
      addonSlug: string,
    },
  |},
  pageSize: number | null,
  reviewCount?: number,
  reviews?: Array<UserReviewType>,
  history: ReactRouterHistoryType,
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
    const { addon, dispatch, errorHandler, match, reviews } = {
      ...this.props,
      ...nextProps,
    };

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    if (!addon) {
      dispatch(fetchAddon({ slug: match.params.addonSlug, errorHandler }));
    } else if (
      // This is the first time rendering the component.
      !nextProps ||
      // The component is getting updated with a new addon type.
      (nextAddon && lastAddon && nextAddon.type !== lastAddon.type)
    ) {
      dispatch(setViewContext(addon.type));
    }

    let { location } = this.props;
    let locationChanged = false;
    if (nextProps && nextProps.location) {
      if (nextProps.location !== location) {
        locationChanged = true;
      }
      location = nextProps.location;
    }

    if (!reviews || locationChanged) {
      dispatch(
        fetchReviews({
          addonSlug: match.params.addonSlug,
          errorHandlerId: errorHandler.id,
          // TODO: so, there is a test case (`it dispatches fetchReviews with
          // an invalid page variable`) that conflicts with `fetchReviews()`
          // requiring a page of type `number`. We should decide whether `page`
          // can be anything OR restrict to integer values.
          // $FLOW_FIXME
          page: this.getCurrentPage(location),
        }),
      );
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

  getCurrentPage(location: ReactRouterLocationType) {
    return location.query.page || 1;
  }

  onReviewSubmitted = () => {
    const { clientApp, dispatch, lang, location, match, history } = this.props;
    // Now that a new review has been submitted, reset the list
    // so that it gets reloaded.
    dispatch(clearAddonReviews({ addonSlug: match.params.addonSlug }));

    if (this.getCurrentPage(location) !== 1) {
      history.push({
        pathname: `/${lang}/${clientApp}${this.url()}`,
        query: { page: 1 },
      });
    }
  };

  render() {
    const {
      addon,
      errorHandler,
      location,
      i18n,
      pageSize,
      reviewCount,
      reviews,
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
      if (
        errorHandler.capturedError.responseStatusCode === 401 ||
        errorHandler.capturedError.responseStatusCode === 403 ||
        errorHandler.capturedError.responseStatusCode === 404
      ) {
        return <NotFound />;
      }
    }

    // When reviews have not loaded yet, make a list of 4 empty reviews
    // as a placeholder.
    const allReviews = reviews || Array(4).fill(null);
    const iconUrl = getAddonIconUrl(addon);
    const iconImage = (
      <img
        className="AddonReviewList-header-icon-image"
        src={iconUrl}
        alt={i18n.gettext('Add-on icon')}
      />
    );

    let header;
    if (addon) {
      header = i18n.sprintf(i18n.gettext('Reviews for %(addonName)s'), {
        addonName: addon.name,
      });
    } else {
      header = <LoadingText />;
    }

    const addonRatingCount =
      addon && addon.ratings ? addon.ratings.text_count : null;
    let addonName;
    let reviewCountHTML;
    if (addon && addonRatingCount !== null) {
      addonName = <Link to={this.addonURL()}>{addon.name}</Link>;
      reviewCountHTML = i18n.sprintf(
        i18n.ngettext(
          '%(total)s review for this add-on',
          '%(total)s reviews for this add-on',
          addonRatingCount,
        ),
        {
          total: i18n.formatNumber(addonRatingCount),
        },
      );
    } else {
      addonName = <LoadingText />;
      reviewCountHTML = <LoadingText />;
    }

    const authorProps = {};
    if (addon && addon.authors) {
      const authorList = addon.authors.map((author) => {
        if (author.url) {
          return oneLine`
            <a
              class="AddonReviewList-addon-author-link"
              href="${author.url}"
            >${author.name}</a>`;
        }

        return author.name;
      });
      const title = i18n.sprintf(
        // translators: Example: by The Author, The Next Author
        i18n.gettext('by %(authorList)s'),
        {
          addonName: addon.name,
          authorList: authorList.join(', '),
        },
      );
      authorProps.dangerouslySetInnerHTML = sanitizeHTML(title, ['a', 'span']);
    } else {
      authorProps.children = <LoadingText />;
    }
    /* eslint-disable jsx-a11y/heading-has-content */
    const authorsHTML = (
      <h3 className="AddonReviewList-header-authors" {...authorProps} />
    );
    /* eslint-enable jsx-a11y/heading-has-content */

    const paginator =
      addon && reviewCount && pageSize && reviewCount > pageSize ? (
        <Paginate
          LinkComponent={Link}
          count={reviewCount}
          currentPage={this.getCurrentPage(location)}
          pathname={this.url()}
          perPage={pageSize}
        />
      ) : null;

    return (
      <div
        className={makeClassName(
          'AddonReviewList',
          addon && addon.type ? [`AddonReviewList--${addon.type}`] : null,
        )}
      >
        {addon && (
          <Helmet>
            <title>{header}</title>
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        <Card className="AddonReviewList-addon">
          <div className="AddonReviewList-header">
            <div className="AddonReviewList-header-icon">
              {addon ? (
                <Link to={this.addonURL()}>{iconImage}</Link>
              ) : (
                iconImage
              )}
            </div>
            <div className="AddonReviewList-header-text">
              <h1 className="visually-hidden">{header}</h1>
              <h2 className="AddonReviewList-header-addonName">{addonName}</h2>
              {authorsHTML}
            </div>
          </div>

          {addon && addon.current_version ? (
            <RatingManager
              addon={addon}
              location={location}
              onReviewSubmitted={this.onReviewSubmitted}
              version={addon.current_version}
            />
          ) : null}
        </Card>

        <CardList
          className="AddonReviewList-reviews"
          footer={paginator}
          header={reviewCountHTML}
        >
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
      </div>
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: Props) {
  if (
    !ownProps ||
    !ownProps.match ||
    !ownProps.match.params ||
    !ownProps.match.params.addonSlug
  ) {
    throw new Error(
      'The component had a falsey match.params.addonSlug parameter',
    );
  }
  const { addonSlug } = ownProps.match.params;
  const reviewData = state.reviews.byAddon[addonSlug];

  return {
    addon: getAddonBySlug(state, addonSlug),
    clientApp: state.api.clientApp,
    lang: state.api.lang,
    pageSize: reviewData ? reviewData.pageSize : null,
    reviewCount: reviewData && reviewData.reviewCount,
    reviews:
      reviewData &&
      expandReviewObjects({
        state: state.reviews,
        reviews: reviewData.reviews,
      }),
  };
}

export const extractId = (ownProps: Props) => {
  const { location, match } = ownProps;

  return `${match.params.addonSlug}-${location.query.page || ''}`;
};

const AddonReviewList: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonReviewListBase);

export default AddonReviewList;
