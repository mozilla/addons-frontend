/* @flow */
import deepEqual from 'deep-eql';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/Errors/NotFound';
import SearchContextCard from 'amo/components/SearchContextCard';
import SearchFilters from 'amo/components/SearchFilters';
import SearchResults from 'amo/components/SearchResults';
import { searchStart } from 'amo/reducers/search';
import Paginate from 'amo/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  LINE,
  RECOMMENDED,
  REVIEWED_FILTER,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_TRENDING,
  VIEW_CONTEXT_HOME,
  VERIFIED_FILTER,
} from 'amo/constants';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import type { SearchFilters as SearchFiltersType } from 'amo/api/search';
import type { ViewContextType } from 'amo/reducers/viewContext';
import type { AppState } from 'amo/store';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type DefaultExternalProps = {|
  paginationQueryParams?: Object,
  pathname?: string,
  pageTitle?: string,
|};

type DefaultInternalProps = {|
  LinkComponent: React.Node,
|};

type DefaultProps = {|
  ...DefaultExternalProps,
  ...DefaultInternalProps,
|};

type Props = {|
  filters: SearchFiltersType | null,
  ...DefaultExternalProps,
|};

type PropsFromState = {|
  context: ViewContextType,
  count: number,
  filtersUsedForResults: SearchFiltersType | null,
  loading: boolean,
  pageSize: string | null,
  results: Array<AddonType | CollectionAddonType>,
  receivedPageCount: number,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  pathname: string,
|};

export class SearchBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    LinkComponent: Link,
    paginationQueryParams: null,
    pathname: '/search/',
  };

  constructor(props: InternalProps) {
    super(props);

    this.dispatchSearch({
      newFilters: props.filters,
      oldFilters: props.filtersUsedForResults,
    });
  }

  componentDidUpdate({ filters: oldFilters }: InternalProps) {
    const { filters: newFilters } = this.props;

    this.dispatchSearch({ newFilters, oldFilters });
  }

  dispatchSearch({
    newFilters,
    oldFilters,
  }: {|
    newFilters: SearchFiltersType | null,
    oldFilters: SearchFiltersType | null,
  |}) {
    const { context, dispatch, errorHandler } = this.props;
    const fixedNewFilters = newFilters || {};
    const { addonType } = fixedNewFilters;

    if (!deepEqual(oldFilters, newFilters)) {
      dispatch(
        searchStart({
          errorHandlerId: errorHandler.id,
          filters: fixedNewFilters,
        }),
      );

      if (addonType) {
        dispatch(setViewContext(addonType));
      }
    }

    if (!addonType && context !== VIEW_CONTEXT_HOME) {
      dispatch(setViewContext(VIEW_CONTEXT_HOME));
    }
  }

  renderHelmet(): React.Node {
    const { i18n, filters, pageTitle, count } = this.props;

    let title = pageTitle;

    if (!title) {
      title = i18n.t('Search results');

      if (filters && filters.promoted) {
        if (filters.promoted === RECOMMENDED) {
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.t('Recommended extensions');
              break;
            case ADDON_TYPE_STATIC_THEME:
              title = i18n.t('Recommended themes');
              break;
            default:
              title = i18n.t('Recommended add-ons');
          }
        } else if (filters.promoted === LINE) {
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.t('Extensions by Firefox');
              break;
            case ADDON_TYPE_STATIC_THEME:
              title = i18n.t('Themes by Firefox');
              break;
            default:
              title = i18n.t('Add-ons by Firefox');
          }
        } else if (filters.promoted === REVIEWED_FILTER) {
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.t('Reviewed extensions');
              break;
            case ADDON_TYPE_STATIC_THEME:
              title = i18n.t('Reviewed themes');
              break;
            default:
              title = i18n.t('Reviewed add-ons');
          }
        } else if (filters.promoted === VERIFIED_FILTER) {
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.t('Verified extensions');
              break;
            case ADDON_TYPE_STATIC_THEME:
              title = i18n.t('Verified themes');
              break;
            default:
              title = i18n.t('Verified add-ons');
          }
        }
      } else if (filters && filters.sort) {
        switch (filters.sort) {
          case SEARCH_SORT_TRENDING:
            switch (filters.addonType) {
              case ADDON_TYPE_EXTENSION:
                title = i18n.t('Trending extensions');
                break;
              case ADDON_TYPE_STATIC_THEME:
                title = i18n.t('Trending themes');
                break;
              default:
                title = i18n.t('Trending add-ons');
            }
            break;
          case SEARCH_SORT_TOP_RATED:
            switch (filters.addonType) {
              case ADDON_TYPE_EXTENSION:
                title = i18n.t('Top rated extensions');
                break;
              case ADDON_TYPE_STATIC_THEME:
                title = i18n.t('Top rated themes');
                break;
              default:
                title = i18n.t('Top rated add-ons');
            }
            break;
          case SEARCH_SORT_POPULAR:
            switch (filters.addonType) {
              case ADDON_TYPE_EXTENSION:
                title = i18n.t('Popular extensions');
                break;
              case ADDON_TYPE_STATIC_THEME:
                title = i18n.t('Popular themes');
                break;
              default:
                title = i18n.t('Popular add-ons');
            }
            break;
          default:
        }
      } else if (filters && filters.query) {
        title = i18n.t('Search results for "%(query)s"', {
          query: filters.query,
        });
      }
    }

    return (
      <Helmet>
        <title>{title}</title>
        {count === 0 && <meta name="robots" content="noindex, follow" />}
      </Helmet>
    );
  }

  render(): React.Node {
    const {
      LinkComponent,
      count,
      errorHandler,
      filters,
      loading,
      pageSize,
      receivedPageCount,
      paginationQueryParams,
      pathname,
      results,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn(`Captured API Error: ${errorHandler.capturedError.messages}`);

      // We treat both a 404 and a 400 from the API as a 404. This captures the
      // case when an invalid category is passed, but is useful in other cases
      // as well.
      if ([400, 404].includes(errorHandler.capturedError.responseStatusCode)) {
        return <NotFound />;
      }
    }

    // We allow specific paginationQueryParams instead of always using
    // convertFiltersToQueryParams(filters) so certain search filters
    // aren't repeated if they are elsewhere in the URL. This is useful
    // for pages like the category page which contain `addonType` and
    // `category` in their URLs
    // (eg: `/extensions/categories/feed-news-blogging/`) so they don't
    // need them in the queryParams.
    //
    // If paginator params aren't specified, we fallback to filters.
    const queryParams =
      paginationQueryParams || convertFiltersToQueryParams(filters);
    const currentPage = filters ? filters.page : undefined;

    const paginator =
      count > Number(pageSize) ? (
        <Paginate
          LinkComponent={LinkComponent}
          count={count}
          currentPage={currentPage}
          pathname={pathname}
          perPage={Number(pageSize)}
          queryParams={queryParams}
          receivedPageCount={receivedPageCount}
        />
      ) : null;

    return (
      <div className="Search">
        {this.renderHelmet()}

        {errorHandler.renderErrorIfPresent()}

        <SearchContextCard />
        <SearchFilters filters={filters || {}} pathname={pathname} />
        <SearchResults
          count={count}
          filters={filters}
          loading={loading}
          paginator={paginator}
          results={results}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    context: state.viewContext.context,
    count: state.search.count,
    filtersUsedForResults: state.search.filters,
    loading: state.search.loading,
    pageSize: state.search.pageSize,
    receivedPageCount: state.search.pageCount,
    results: state.search.results,
  };
};

// This ID does not need to differentiate between component instances because
// the error handler gets cleared every time the search filters change.
export const extractId = (ownProps: InternalProps): void | string => {
  return ownProps.filters ? ownProps.filters.page : '';
};

const Search: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(SearchBase);

export default Search;
