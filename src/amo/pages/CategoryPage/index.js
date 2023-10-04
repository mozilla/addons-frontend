/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import HeadLinks from 'amo/components/HeadLinks';
import Page from 'amo/components/Page';
import Search from 'amo/components/Search';
import { ADDON_TYPE_STATIC_THEME, DEFAULT_CATEGORY_SORT } from 'amo/constants';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchCategories } from 'amo/reducers/categories';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  fixFiltersFromLocation,
} from 'amo/searchUtils';
import { apiAddonType } from 'amo/utils';
import {
  getCategoryResultsPathname,
  getCategoryName,
} from 'amo/utils/categories';
import type { SearchFilters } from 'amo/api/search';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| categorySlug: string, visibleAddonType: string |},
  |},
|};

type PropsFromState = {|
  addonType: string,
  categoryName: string | null,
  filters: SearchFilters,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class CategoryPageBase extends React.Component<InternalProps> {
  getPageTitle(categoryName: string | null): string {
    const { addonType, i18n } = this.props;

    if (addonType === ADDON_TYPE_STATIC_THEME) {
      return categoryName
        ? i18n.sprintf(i18n.gettext('Themes in %(categoryName)s'), {
            categoryName,
          })
        : i18n.gettext('Themes');
    }
    return categoryName
      ? i18n.sprintf(i18n.gettext('Extensions in %(categoryName)s'), {
          categoryName,
        })
      : i18n.gettext('Extensions');
  }

  constructor(props: InternalProps) {
    super(props);

    if (!this.props.categoryName) {
      this.props.dispatch(
        fetchCategories({ errorHandlerId: this.props.errorHandler.id }),
      );
    }
  }

  render(): React.Node {
    const { addonType, categoryName, filters, match } = this.props;
    const { categorySlug } = match.params;

    const filtersForSearch = {
      ...filters,
      addonType,
      category: categorySlug,
      sort: filters.sort || DEFAULT_CATEGORY_SORT,
    };

    return (
      <Page>
        <HeadLinks />
        <Search
          filters={filtersForSearch}
          pageTitle={this.getPageTitle(categoryName)}
          paginationQueryParams={convertFiltersToQueryParams(filters)}
          pathname={getCategoryResultsPathname({
            addonType,
            slug: categorySlug,
          })}
        />
      </Page>
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  const { location } = state.router;
  const { categorySlug, visibleAddonType } = ownProps.match.params;

  let categoryName = null;

  const addonType = apiAddonType(visibleAddonType);
  const categoriesState = state.categories.categories;

  if (categoriesState) {
    const categories = categoriesState[addonType];
    categoryName = getCategoryName(categories, categorySlug);
  }

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  return {
    addonType,
    categoryName,
    filters: fixFiltersFromLocation(filtersFromLocation),
  };
};

export const extractId = (ownProps: Props): string => {
  return ownProps.match.params.categorySlug;
};

const CategoryPage: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(CategoryPageBase);

export default CategoryPage;
