/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import HeadLinks from 'amo/components/HeadLinks';
import Page from 'amo/components/Page';
import Search from 'amo/components/Search';
import { DEFAULT_TAG_SORT } from 'amo/constants';
import translate from 'amo/i18n/translate';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  fixFiltersFromLocation,
} from 'amo/searchUtils';
import { getTagResultsPathname } from 'amo/utils/tags';
import type { SearchFilters } from 'amo/api/search';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterMatchType } from 'amo/types/router';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| tag: string |},
  |},
|};

type PropsFromState = {|
  filters: SearchFilters,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

export class TagPageBase extends React.Component<InternalProps> {
  getPageTitle(tag: string): string {
    const { i18n } = this.props;

    return i18n.t('Add-ons tagged with %(tag)s', {
      tag,
    });
  }

  render(): React.Node {
    const { filters, match } = this.props;
    const { tag } = match.params;

    // filters doesn't contain tag because we delete it in components/SearchFilters
    const filtersForSearch = {
      ...filters,
      tag,
      sort: filters.sort || DEFAULT_TAG_SORT,
    };

    return (
      <Page>
        <HeadLinks />
        <Search
          filters={filtersForSearch}
          pageTitle={this.getPageTitle(tag)}
          paginationQueryParams={convertFiltersToQueryParams(filters)}
          pathname={getTagResultsPathname({ tag })}
        />
      </Page>
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  const { location } = state.router;

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  return {
    filters: fixFiltersFromLocation(filtersFromLocation),
  };
};

const TagPage: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(TagPageBase);

export default TagPage;
