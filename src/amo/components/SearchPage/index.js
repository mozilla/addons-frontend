/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { makeQueryString } from 'core/api';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
} from 'core/searchUtils';
import type { ReactRouterLocation } from 'core/types/router';


type Props = {|
  clientApp: string,
  dispatch: Function,
  filters: Object,
  lang: string,
  location: ReactRouterLocation,
  pathname: string,
|};

export class SearchPageBase extends React.Component<Props> {
  componentWillMount() {
    const { clientApp, filters, lang, location } = this.props;

    // Map the old `atype` parameter to its corresponding `adddonType`.
    // See: https://github.com/mozilla/addons-frontend/issues/3791.
    const newFilters = { ...filters };
    if (location.query.atype) {
      switch (String(location.query.atype)) {
        case '1':
          newFilters.addonType = ADDON_TYPE_EXTENSION;
          break;
        case '3':
          newFilters.addonType = ADDON_TYPE_DICT;
          break;
        case '4':
          newFilters.addonType = ADDON_TYPE_OPENSEARCH;
          break;
        case '5':
          newFilters.addonType = ADDON_TYPE_LANG;
          break;
        case '9':
          newFilters.addonType = ADDON_TYPE_THEME;
          break;
        default:
          return;
      }

      const queryString = makeQueryString(
        convertFiltersToQueryParams(newFilters)
      );

      this.props.dispatch(sendServerRedirect({
        status: 302,
        url: `/${lang}/${clientApp}/search/${queryString}`,
      }));
    }
  }

  render() {
    const { filters, pathname, ...otherProps } = this.props;

    return (
      <Search
        {...otherProps}
        enableSearchFilters
        filters={filters}
        paginationQueryParams={convertFiltersToQueryParams(filters)}
        pathname={pathname}
      />
    );
  }
}

export function mapStateToProps(state: any, ownProps: Props) {
  const { location } = ownProps;

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  // We don't allow `clientApp` or `lang` as a filter from location because
  // they can lead to weird, unintuitive URLs where the queryParams override
  // the `clientApp` and `lang` set elsewhere in the URL.
  // Removing them from the filters (essentially ignoring them) means URLs
  // like: `/en-US/firefox/search/?q=test&app=android&lang=fr` don't search
  // for French Android add-ons.
  // Maybe in the future this could redirect instead of ignoring bogus
  // `location.query` data.
  const filters = { ...filtersFromLocation };
  delete filters.clientApp;
  delete filters.lang;

  return {
    filters,
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
}

export default compose(
  connect(mapStateToProps),
)(SearchPageBase);
