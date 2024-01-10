/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Card from 'amo/components/Card';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchCategories } from 'amo/reducers/categories';
import { getCategoryName } from 'amo/utils/categories';
import type { SearchFilters } from 'amo/api/search';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {||};

type PropsFromState = {|
  categoryName: string | null,
  count: number,
  filters: SearchFilters | null,
  hasCategory: boolean,
  loadingSearch: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class SearchContextCardBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    if (this.props.hasCategory && !this.props.categoryName) {
      this.props.dispatch(
        fetchCategories({ errorHandlerId: this.props.errorHandler.id }),
      );
    }
  }

  render(): React.Node {
    const { categoryName, count, filters, i18n, loadingSearch } = this.props;
    const { addonType, query, tag } = filters || {};
    let searchText;

    if (!loadingSearch) {
      switch (addonType) {
        case ADDON_TYPE_EXTENSION:
          if (categoryName && query && tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found for "%(query)s" with tag %(tag)s in %(categoryName)s' -> '%(count)s extension found for "%(query)s" with tag %(tag)s in %(categoryName)s_one'
            '%(count)s extensions found for "%(query)s" with tag %(tag)s in %(categoryName)s' -> '%(count)s extension found for "%(query)s" with tag %(tag)s in %(categoryName)s_other' */ i18n.t(
              '%(count)s extension found for "%(query)s" with tag %(tag)s in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
                categoryName,
                tag,
              },
            );
          } else if (categoryName && query) {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found for "%(query)s" in %(categoryName)s' -> '%(count)s extension found for "%(query)s" in %(categoryName)s_one'
            '%(count)s extensions found for "%(query)s" in %(categoryName)s' -> '%(count)s extension found for "%(query)s" in %(categoryName)s_other' */ i18n.t(
              '%(count)s extension found for "%(query)s" in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
                categoryName,
              },
            );
          } else if (categoryName && tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found with tag %(tag)s in %(categoryName)s' -> '%(count)s extension found with tag %(tag)s in %(categoryName)s_one'
            '%(count)s extensions found with tag %(tag)s in %(categoryName)s' -> '%(count)s extension found with tag %(tag)s in %(categoryName)s_other' */ i18n.t(
              '%(count)s extension found with tag %(tag)s in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                categoryName,
                tag,
              },
            );
          } else if (categoryName) {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found in %(categoryName)s' -> '%(count)s extension found in %(categoryName)s_one'
            '%(count)s extensions found in %(categoryName)s' -> '%(count)s extension found in %(categoryName)s_other' */ i18n.t(
              '%(count)s extension found in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                categoryName,
              },
            );
          } else if (query && tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found for "%(query)s" with tag %(tag)s' -> '%(count)s extension found for "%(query)s" with tag %(tag)s_one'
            '%(count)s extensions found for "%(query)s" with tag %(tag)s' -> '%(count)s extension found for "%(query)s" with tag %(tag)s_other' */ i18n.t(
              '%(count)s extension found for "%(query)s" with tag %(tag)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
                tag,
              },
            );
          } else if (query) {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found for "%(query)s"' -> '%(count)s extension found for "%(query)s"_one'
            '%(count)s extensions found for "%(query)s"' -> '%(count)s extension found for "%(query)s"_other' */ i18n.t(
              '%(count)s extension found for "%(query)s"',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
              },
            );
          } else if (tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found with tag %(tag)s' -> '%(count)s extension found with tag %(tag)s_one'
            '%(count)s extensions found with tag %(tag)s' -> '%(count)s extension found with tag %(tag)s_other' */ i18n.t(
              '%(count)s extension found with tag %(tag)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                tag,
              },
            );
          } else {
            searchText = /* manual-change: merge keys 
            '%(count)s extension found' -> '%(count)s extension found_one'
            '%(count)s extensions found' -> '%(count)s extension found_other' */ i18n.t(
              '%(count)s extension found',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
              },
            );
          }
          break;
        case ADDON_TYPE_STATIC_THEME:
          if (categoryName && query && tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found for "%(query)s" with tag %(tag)s in %(categoryName)s' -> '%(count)s theme found for "%(query)s" with tag %(tag)s in %(categoryName)s_one'
            '%(count)s themes found for "%(query)s" with tag %(tag)s in %(categoryName)s' -> '%(count)s theme found for "%(query)s" with tag %(tag)s in %(categoryName)s_other' */ i18n.t(
              '%(count)s theme found for "%(query)s" with tag %(tag)s in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
                categoryName,
                tag,
              },
            );
          } else if (categoryName && query) {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found for "%(query)s" in %(categoryName)s' -> '%(count)s theme found for "%(query)s" in %(categoryName)s_one'
            '%(count)s themes found for "%(query)s" in %(categoryName)s' -> '%(count)s theme found for "%(query)s" in %(categoryName)s_other' */ i18n.t(
              '%(count)s theme found for "%(query)s" in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
                categoryName,
              },
            );
          } else if (categoryName && tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found with tag %(tag)s in %(categoryName)s' -> '%(count)s theme found with tag %(tag)s in %(categoryName)s_one'
            '%(count)s themes found with tag %(tag)s in %(categoryName)s' -> '%(count)s theme found with tag %(tag)s in %(categoryName)s_other' */ i18n.t(
              '%(count)s theme found with tag %(tag)s in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                categoryName,
                tag,
              },
            );
          } else if (categoryName) {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found in %(categoryName)s' -> '%(count)s theme found in %(categoryName)s_one'
            '%(count)s themes found in %(categoryName)s' -> '%(count)s theme found in %(categoryName)s_other' */ i18n.t(
              '%(count)s theme found in %(categoryName)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                categoryName,
              },
            );
          } else if (query && tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found for "%(query)s" with tag %(tag)s' -> '%(count)s theme found for "%(query)s" with tag %(tag)s_one'
            '%(count)s themes found for "%(query)s" with tag %(tag)s' -> '%(count)s theme found for "%(query)s" with tag %(tag)s_other' */ i18n.t(
              '%(count)s theme found for "%(query)s" with tag %(tag)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
                tag,
              },
            );
          } else if (query) {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found for "%(query)s"' -> '%(count)s theme found for "%(query)s"_one'
            '%(count)s themes found for "%(query)s"' -> '%(count)s theme found for "%(query)s"_other' */ i18n.t(
              '%(count)s theme found for "%(query)s"',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
              },
            );
          } else if (tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found with tag %(tag)s' -> '%(count)s theme found with tag %(tag)s_one'
            '%(count)s themes found with tag %(tag)s' -> '%(count)s theme found with tag %(tag)s_other' */ i18n.t(
              '%(count)s theme found with tag %(tag)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                tag,
              },
            );
          } else {
            searchText = /* manual-change: merge keys 
            '%(count)s theme found' -> '%(count)s theme found_one'
            '%(count)s themes found' -> '%(count)s theme found_other' */ i18n.t(
              '%(count)s theme found',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
              },
            );
          }
          break;
        default:
          if (query && tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s result found for "%(query)s" with tag %(tag)s' -> '%(count)s result found for "%(query)s" with tag %(tag)s_one'
            '%(count)s results found for "%(query)s" with tag %(tag)s' -> '%(count)s result found for "%(query)s" with tag %(tag)s_other' */ i18n.t(
              '%(count)s result found for "%(query)s" with tag %(tag)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
                tag,
              },
            );
          } else if (query) {
            searchText = /* manual-change: merge keys 
            '%(count)s result found for "%(query)s"' -> '%(count)s result found for "%(query)s"_one'
            '%(count)s results found for "%(query)s"' -> '%(count)s result found for "%(query)s"_other' */ i18n.t(
              '%(count)s result found for "%(query)s"',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                query,
              },
            );
          } else if (tag) {
            searchText = /* manual-change: merge keys 
            '%(count)s result found with tag %(tag)s' -> '%(count)s result found with tag %(tag)s_one'
            '%(count)s results found with tag %(tag)s' -> '%(count)s result found with tag %(tag)s_other' */ i18n.t(
              '%(count)s result found with tag %(tag)s',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
                tag,
              },
            );
          } else {
            searchText = /* manual-change: merge keys 
            '%(count)s result found' -> '%(count)s result found_one'
            '%(count)s results found' -> '%(count)s result found_other' */ i18n.t(
              '%(count)s result found',
              {
                count: count,

                count_prop: i18n.formatNumber(count),
              },
            );
          }
          break;
      }
    } else if (loadingSearch && query) {
      searchText = i18n.t('Searching for "%(query)s"', {
        query,
      });
    } else if (loadingSearch) {
      searchText = i18n.t('Searching for add-ons');
    }

    return (
      <Card className="SearchContextCard">
        <h1 className="SearchContextCard-header">{searchText}</h1>
      </Card>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  const { search } = state;
  const { filters } = search;

  let currentCategory;
  let categoryName = null;

  if (
    search &&
    filters &&
    filters.category &&
    typeof filters.category === 'string'
  ) {
    currentCategory = filters.category;
  }

  if (currentCategory) {
    const categoriesState = state.categories.categories;

    if (categoriesState) {
      if (
        filters &&
        filters.addonType &&
        typeof filters.addonType === 'string'
      ) {
        const { addonType } = filters;
        const categories = categoriesState[addonType];

        categoryName = getCategoryName(categories, currentCategory);
      }
    }
  }

  return {
    hasCategory: !!currentCategory,
    categoryName,
    count: search.count || 0,
    filters,
    loadingSearch: search.loading,
  };
}

const SearchContextCard: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withErrorHandler({ id: 'SearchContextCard' }),
)(SearchContextCardBase);

export default SearchContextCard;
