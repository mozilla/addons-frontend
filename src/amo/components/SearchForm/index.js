/* @flow */
import url from 'url';

import makeClassName from 'classnames';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import { CLIENT_APP_ANDROID } from 'core/constants';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import translate from 'core/i18n/translate';
import type {
  SearchFilters,
  SuggestionType,
} from 'amo/components/AutoSearchInput';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterHistoryType } from 'core/types/router';

type Props = {|
  apiLang: string | null,
  className?: string,
  clientApp: string | null,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  pathname: string,
|};

export class SearchFormBase extends React.Component<Props> {
  onSearch = (filters: SearchFilters) => {
    this.props.history.push({
      pathname: this.baseSearchURL(),
      query: convertFiltersToQueryParams(filters),
    });
  };

  onSuggestionSelected = (suggestion: SuggestionType) => {
    const { pathname } = url.parse(suggestion.url);

    if (pathname) {
      this.props.history.push(pathname);
    }
  };

  baseSearchURL() {
    const { apiLang, clientApp, pathname } = this.props;
    return `/${apiLang || ''}/${clientApp || ''}${pathname}`;
  }

  render() {
    const { className, i18n, apiLang, clientApp } = this.props;

    const i18nValues = {
      locale: apiLang,
    };

    let openSearchTitle = i18n.sprintf(
      i18n.gettext('Firefox Add-ons'),
      i18nValues,
    );

    if (clientApp === CLIENT_APP_ANDROID) {
      openSearchTitle = i18n.sprintf(
        i18n.gettext('Firefox Add-ons for Android'),
        i18nValues,
      );
    }

    return (
      <>
        <Helmet>
          <link
            title={openSearchTitle}
            rel="search"
            type="application/opensearchdescription+xml"
            href={`/${apiLang || ''}/${clientApp || ''}/opensearch.xml`}
          />
        </Helmet>

        <form
          action={this.baseSearchURL()}
          className={makeClassName('SearchForm', className)}
          method="GET"
          data-no-csrf
          role="search"
        >
          <AutoSearchInput
            inputName="q"
            onSearch={this.onSearch}
            onSuggestionSelected={this.onSuggestionSelected}
            selectSuggestionText={i18n.gettext('Go to the add-on page')}
            showInputLabel={false}
          />
        </form>
      </>
    );
  }
}

export function mapStateToProps(state: AppState): $Shape<Props> {
  const { api } = state;

  return { apiLang: api.lang, clientApp: api.clientApp };
}

const SearchForm: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(SearchFormBase);

export default SearchForm;
