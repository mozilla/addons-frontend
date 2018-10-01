/* @flow */
import * as React from 'react';
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
import log from 'core/logger';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
} from 'core/searchUtils';
import type { AppState } from 'amo/store';
import type { FiltersType } from 'core/reducers/search';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocationType } from 'core/types/router';

type Props = {|
  location: ReactRouterLocationType,
|};

type InternalProps = {|
  ...Props,
  clientApp: string,
  dispatch: DispatchFunc,
  filters: FiltersType,
  lang: string,
|};

export class SearchPageBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { clientApp, filters, lang, location } = props;

    let shouldRedirect = false;
    const newFilters = { ...filters };

    // The legacy frontend uses `all` to express "all platforms" but we now use
    // no parameter (empty) to target all platforms. In addition, the query
    // parameter `platform` is mapped to the `operatingSystem` filter.
    // See: https://github.com/mozilla/addons-frontend/issues/3870.
    if (
      newFilters.operatingSystem &&
      newFilters.operatingSystem.toLowerCase() === 'all'
    ) {
      log.info('`operatingSystem` filter is set to "all", omitting it.');
      delete newFilters.operatingSystem;

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

      shouldRedirect = true;
    }

    if (shouldRedirect) {
      const queryString = makeQueryString(
        convertFiltersToQueryParams(newFilters),
      );

      props.dispatch(
        sendServerRedirect({
          status: 301,
          url: `/${lang}/${clientApp}/search/${queryString}`,
        }),
      );
    }
  }

  render() {
    const { filters } = this.props;

    return (
      <Search
        enableSearchFilters
        filters={filters}
        paginationQueryParams={convertFiltersToQueryParams(filters)}
      />
    );
  }
}

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
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

const SearchPage: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
)(SearchPageBase);

export default SearchPage;
