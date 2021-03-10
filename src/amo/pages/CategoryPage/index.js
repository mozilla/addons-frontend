/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import HeadLinks from 'amo/components/HeadLinks';
import Page from 'amo/components/Page';
import Search from 'amo/components/Search';
import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchCategories } from 'amo/reducers/categories';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  fixFiltersFromLocation,
} from 'amo/searchUtils';
import { apiAddonType } from 'amo/utils';
import { getCategoryResultsPathname } from 'amo/utils/categories';
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
  getPageTitle(addonType: string, categoryName: string | null): string {
    const { i18n } = this.props;

    // The only two possibilites for addonType are 'extension' and
    // 'statictheme' because anything else would have thrown an
    // exception in mapStateToProps via apiAddonType()
    if (addonType === ADDON_TYPE_EXTENSION) {
      return categoryName
        ? i18n.sprintf(i18n.gettext('%(categoryName)s extensions'), {
            categoryName,
          })
        : i18n.gettext('Extensions');
    }

    return categoryName
      ? i18n.sprintf(i18n.gettext('%(categoryName)s themes'), {
          categoryName,
        })
      : i18n.gettext('Themes');
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
    const { categoryName, filters, match } = this.props;
    const { categorySlug, visibleAddonType } = match.params;
    const addonType = apiAddonType(visibleAddonType);
    const filtersForSearch = {
      ...filters,
      addonType,
      category: categorySlug,
    };

    return (
      <Page>
        <HeadLinks />
        <Search
          enableSearchFilters
          filters={filtersForSearch}
          pageTitle={this.getPageTitle(addonType, categoryName)}
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

function mapStateToProps(state: AppState, ownProps: Props): PropsFromState {
  const { location } = state.router;
  const { categorySlug, visibleAddonType } = ownProps.match.params;

  let categoryName = null;

  const addonType = apiAddonType(visibleAddonType);
  const categoriesState = state.categories.categories;
  const { clientApp } = state.api;

  if (categoriesState && clientApp) {
    const appTypes = categoriesState[clientApp];

    if (appTypes) {
      const categories = appTypes[addonType];

      if (categories && categories[categorySlug]) {
        categoryName = categories[categorySlug].name;
      }
    }
  }

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  return {
    categoryName,
    filters: fixFiltersFromLocation(filtersFromLocation),
  };
}

const CategoryPage: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'CategoryPage' }),
)(CategoryPageBase);

export default CategoryPage;
