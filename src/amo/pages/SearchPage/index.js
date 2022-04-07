/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Page from 'amo/components/Page';
import Search from 'amo/components/Search';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  DEFAULT_CATEGORY_SORT,
  DEFAULT_TAG_SORT,
} from 'amo/constants';
import { makeQueryString } from 'amo/api';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  fixFiltersFromLocation,
} from 'amo/searchUtils';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import { getTagResultsPathname } from 'amo/utils/tags';
import { visibleAddonTypeIsValid } from 'amo/utils';
import type { AppState } from 'amo/store';
import type { SearchFilters } from 'amo/api/search';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterLocationType } from 'amo/types/router';

type Props = {|
  location: ReactRouterLocationType,
|};

type PropsFromState = {|
  clientApp: string,
  filters: SearchFilters,
  lang: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
|};

export class SearchPageBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { clientApp, filters, lang, location } = props;

    let pathname = '/search/';
    let shouldRedirect = false;
    const newFilters = { ...filters };

    // If this is an old category search, redirect to the new category page,
    // unless the `type` is invalid.
    if (
      newFilters.category &&
      newFilters.addonType &&
      visibleAddonTypeIsValid(newFilters.addonType)
    ) {
      pathname = getCategoryResultsPathname({
        addonType: newFilters.addonType,
        slug: newFilters.category,
      });

      delete newFilters.addonType;
      delete newFilters.category;

      if (newFilters.sort === DEFAULT_CATEGORY_SORT) {
        delete newFilters.sort;
      }

      shouldRedirect = true;
    } else if (
      // If this is a tag search we want to redirect to new tag pages.
      newFilters.tag
    ) {
      pathname = getTagResultsPathname({ tag: newFilters.tag });

      delete newFilters.tag;

      if (newFilters.sort === DEFAULT_TAG_SORT) {
        delete newFilters.sort;
      }

      shouldRedirect = true;
    }

    // We removed the `platform` parameter, so if it's present, ignore it and
    // redirect.
    if (location.query.platform) {
      shouldRedirect = true;
    }

    // Map the old `atype` parameter to its corresponding `adddonType`.
    // See: https://github.com/mozilla/addons-frontend/issues/3791.
    if (location.query.atype) {
      switch (String(location.query.atype)) {
        case '1':
          newFilters.addonType = ADDON_TYPE_EXTENSION;
          break;
        case '3':
          newFilters.addonType = ADDON_TYPE_DICT;
          break;
        case '5':
          newFilters.addonType = ADDON_TYPE_LANG;
          break;
        default:
          return;
      }

      shouldRedirect = true;
    }

    if (shouldRedirect) {
      const queryString = makeQueryString(
        convertFiltersToQueryParams(newFilters),
      );

      props.dispatch(
        sendServerRedirect({
          status: 301,
          url: `/${lang}/${clientApp}${pathname}${queryString}`,
        }),
      );
    }
  }

  render(): React.Node {
    const { filters } = this.props;

    return (
      <Page>
        <Search
          filters={filters}
          paginationQueryParams={convertFiltersToQueryParams(filters)}
        />
      </Page>
    );
  }
}

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { location } = ownProps;

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  return {
    filters: fixFiltersFromLocation(filtersFromLocation),
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
}

const SearchPage: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
)(SearchPageBase);

export default SearchPage;
