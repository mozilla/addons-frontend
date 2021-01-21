/* @flow */
import type {ViewContextType} from "../../reducers/viewContext";import deepEqual from 'deep-eql';
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
  VIEW_CONTEXT_EXPLORE,
  VERIFIED_FILTER,
} from 'amo/constants';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import type { AppState } from 'amo/store';
import type { SearchFilters as SearchFiltersType } from 'amo/api/search';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {|
  enableSearchFilters?: boolean,
  filters: SearchFiltersType,
  paginationQueryParams?: Object,
  pathname?: string,
|};

type InternalProps = {|
  ...Props,
  LinkComponent: React.Node,
  context: string,
  count: number,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  filtersUsedForResults: SearchFiltersType | null,
  i18n: I18nType,
  loading: boolean,
  pageSize: string,
  results: Array<AddonType | CollectionAddonType>,
|};

export class SearchBase extends React.Component<InternalProps> {
  static defaultProps: {|
  LinkComponent: any,
  count: number,
  enableSearchFilters: boolean,
  filters: {...},
  filtersUsedForResults: {...},
  paginationQueryParams: null,
  pathname: string,
  results: Array<any>,
|} = {
    LinkComponent: Link,
    count: 0,
    enableSearchFilters: true,
    filters: {},
    filtersUsedForResults: {},
    paginationQueryParams: null,
    pathname: '/search/',
    results: [],
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
    newFilters = {},
    oldFilters,
  }: {|
    newFilters: SearchFiltersType,
    oldFilters: ?SearchFiltersType,
  |} = {}) {
    const { context, dispatch, errorHandler } = this.props;
    const { addonType } = newFilters;

    if (!deepEqual(oldFilters, newFilters)) {
      dispatch(
        searchStart({
          errorHandlerId: errorHandler.id,
          filters: newFilters,
        }),
      );

      if (addonType) {
        dispatch(setViewContext(addonType));
      }
    }

    if (!addonType && context !== VIEW_CONTEXT_EXPLORE) {
      dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));
    }
  }

  renderHelmetTitle(): React.Node {
    const { i18n, filters } = this.props;

    let title = i18n.gettext('Search results');

    if (filters.promoted) {
      if (filters.promoted === RECOMMENDED) {
        switch (filters.addonType) {
          case ADDON_TYPE_EXTENSION:
            title = i18n.gettext('Recommended extensions');
            break;
          case ADDON_TYPE_STATIC_THEME:
            title = i18n.gettext('Recommended themes');
            break;
          default:
            title = i18n.gettext('Recommended add-ons');
        }
      } else if (filters.promoted === LINE) {
        switch (filters.addonType) {
          case ADDON_TYPE_EXTENSION:
            title = i18n.gettext('Extensions by Firefox');
            break;
          case ADDON_TYPE_STATIC_THEME:
            title = i18n.gettext('Themes by Firefox');
            break;
          default:
            title = i18n.gettext('Add-ons by Firefox');
        }
      } else if (filters.promoted === REVIEWED_FILTER) {
        switch (filters.addonType) {
          case ADDON_TYPE_EXTENSION:
            title = i18n.gettext('Reviewed extensions');
            break;
          case ADDON_TYPE_STATIC_THEME:
            title = i18n.gettext('Reviewed themes');
            break;
          default:
            title = i18n.gettext('Reviewed add-ons');
        }
      } else if (filters.promoted === VERIFIED_FILTER) {
        switch (filters.addonType) {
          case ADDON_TYPE_EXTENSION:
            title = i18n.gettext('Verified extensions');
            break;
          case ADDON_TYPE_STATIC_THEME:
            title = i18n.gettext('Verified themes');
            break;
          default:
            title = i18n.gettext('Verified add-ons');
        }
      }
    } else if (filters.sort) {
      switch (filters.sort) {
        case SEARCH_SORT_TRENDING:
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.gettext('Trending extensions');
              break;
            case ADDON_TYPE_STATIC_THEME:
              title = i18n.gettext('Trending themes');
              break;
            default:
              title = i18n.gettext('Trending add-ons');
          }
          break;
        case SEARCH_SORT_TOP_RATED:
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.gettext('Top rated extensions');
              break;
            case ADDON_TYPE_STATIC_THEME:
              title = i18n.gettext('Top rated themes');
              break;
            default:
              title = i18n.gettext('Top rated add-ons');
          }
          break;
        case SEARCH_SORT_POPULAR:
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.gettext('Popular extensions');
              break;
            case ADDON_TYPE_STATIC_THEME:
              title = i18n.gettext('Popular themes');
              break;
            default:
              title = i18n.gettext('Popular add-ons');
          }
          break;
        default:
      }
    } else if (filters.query) {
      title = i18n.sprintf(i18n.gettext('Search results for "%(query)s"'), {
        query: filters.query,
      });
    }

    return (
      <Helmet>
        <title>{title}</title>
      </Helmet>
    );
  }

  render(): React.Node | React.Element<"div"> {
    const {
      LinkComponent,
      count,
      enableSearchFilters,
      errorHandler,
      filters,
      loading,
      pageSize,
      paginationQueryParams,
      pathname,
      results,
    } = this.props;

    if (errorHandler.hasError()) {
      log.warn(`Captured API Error: ${errorHandler.capturedError.messages}`);

      if (errorHandler.capturedError.responseStatusCode === 404) {
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

    const paginator =
      count > Number(pageSize) ? (
        <Paginate
          LinkComponent={LinkComponent}
          count={count}
          currentPage={filters.page}
          pathname={pathname}
          perPage={Number(pageSize)}
          queryParams={queryParams}
        />
      ) : null;

    return (
      <div className="Search">
        {this.renderHelmetTitle()}

        {errorHandler.renderErrorIfPresent()}

        <SearchContextCard />

        {enableSearchFilters ? (
          <SearchFilters filters={filters} pathname={pathname} />
        ) : null}

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

export const mapStateToProps = (state: AppState): {|
  context: ViewContextType,
  count: number,
  filtersUsedForResults: null | SearchFiltersType,
  loading: boolean,
  pageSize: null | string,
  results: Array<AddonType | CollectionAddonType>,
|} => {
  return {
    context: state.viewContext.context,
    count: state.search.count,
    filtersUsedForResults: state.search.filters,
    loading: state.search.loading,
    pageSize: state.search.pageSize,
    results: state.search.results,
  };
};

// This ID does not need to differentiate between component instances because
// the error handler gets cleared every time the search filters change.
export const extractId = (ownProps: InternalProps): void | string => {
  return ownProps.filters.page;
};

const Search: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(SearchBase);

export default Search;
