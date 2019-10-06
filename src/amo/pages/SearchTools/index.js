/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Page from 'amo/components/Page';
import { ADDON_TYPE_OPENSEARCH, SEARCH_SORT_TOP_RATED } from 'core/constants';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import type { SearchFilters } from 'amo/components/AutoSearchInput';
import type { I18nType } from 'core/types/i18n';

type Props = {|
  filters: SearchFilters,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class SearchToolsBase extends React.Component<InternalProps> {
  render() {
    const { filters, i18n } = this.props;

    return (
      <Page>
        <HeadMetaTags
          description={i18n.gettext(`Download Firefox extensions to customize
        the way you search—everything from privacy-enhanced searching to
        website-specific searches, image searching, and more.`)}
          title={i18n.gettext('Search Tools')}
        />

        <HeadLinks />

        <Search
          enableSearchFilters
          filters={filters}
          paginationQueryParams={convertFiltersToQueryParams(filters)}
        />
      </Page>
    );
  }
}

export function mapStateToProps() {
  const filters = {
    addonType: ADDON_TYPE_OPENSEARCH,
    sort: SEARCH_SORT_TOP_RATED,
  };

  return { filters };
}

const SearchTools: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(SearchToolsBase);

export default SearchTools;
