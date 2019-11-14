/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import Search from 'amo/components/Search';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Page from 'amo/components/Page';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import { makeQueryString } from 'core/api';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'core/types/redux';
import type { I18nType } from 'core/types/i18n';
import type { SearchFilters } from 'amo/components/AutoSearchInput';

type Props = {|
  filters: SearchFilters,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  clientApp: string,
  dispatch: DispatchFunc,
  i18n: I18nType,
  lang: string,
|};

export class SearchToolsBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
  };

  constructor(props: InternalProps) {
    super(props);

    // See: https://github.com/mozilla/addons-frontend/issues/8679
    if (props._config.get('enableFeatureRemoveSearchTools')) {
      const { clientApp, dispatch, lang } = props;

      const queryString = makeQueryString({
        category: 'search-tools',
        sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
        type: ADDON_TYPE_EXTENSION,
      });

      dispatch(
        sendServerRedirect({
          status: 301,
          url: `/${lang}/${clientApp}/search/${queryString}`,
        }),
      );
    }
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
    addonType: ADDON_TYPE_OPENSEARCH,
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
