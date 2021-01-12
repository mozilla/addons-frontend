/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Page from 'amo/components/Page';
import { ADDON_TYPE_EXTENSION, SEARCH_SORT_TOP_RATED } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import { makeQueryString } from 'amo/api';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { getCategoryResultsQuery } from 'amo/utils/categories';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';
import type { I18nType } from 'amo/types/i18n';
import type { SearchFilters } from 'amo/components/AutoSearchInput';

type Props = {|
  filters: SearchFilters,
|};

type InternalProps = {|
  ...Props,
  clientApp: string,
  dispatch: DispatchFunc,
  i18n: I18nType,
  lang: string,
|};

export class SearchToolsBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { clientApp, dispatch, lang } = props;

    const queryString = makeQueryString(
      getCategoryResultsQuery({
        addonType: ADDON_TYPE_EXTENSION,
        slug: 'search-tools',
      }),
    );

    dispatch(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/search/${queryString}`,
      }),
    );
  }

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

export function mapStateToProps(state: AppState) {
  const filters = {
    sort: SEARCH_SORT_TOP_RATED,
  };

  return {
    filters,
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
}

const SearchTools: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(SearchToolsBase);

export default SearchTools;
