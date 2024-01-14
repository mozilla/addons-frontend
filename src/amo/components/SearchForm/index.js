/* @flow */
import url from 'url';

import makeClassName from 'classnames';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import { CLIENT_APP_ANDROID } from 'amo/constants';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import translate from 'amo/i18n/translate';
import type { SearchFilters } from 'amo/components/AutoSearchInput';
import type { AppState } from 'amo/store';
import type { SuggestionType } from 'amo/reducers/autocomplete';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterHistoryType } from 'amo/types/router';

type Props = {|
  className?: string,
  pathname: string,
|};

type PropsFromState = {|
  lang: string,
  clientApp: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  history: ReactRouterHistoryType,
  i18n: I18nType,
|};

export class SearchFormBase extends React.Component<InternalProps> {
  onSearch: (filters: SearchFilters) => void = (filters: SearchFilters) => {
    this.props.history.push({
      pathname: this.baseSearchURL(),
      query: convertFiltersToQueryParams(filters),
    });
  };

  onSuggestionSelected: (suggestion: SuggestionType) => void = (
    suggestion: SuggestionType,
  ) => {
    const { pathname } = url.parse(suggestion.url);

    if (pathname) {
      this.props.history.push(pathname);
    }
  };

  baseSearchURL(): string {
    const { lang, clientApp, pathname } = this.props;
    return `/${lang}/${clientApp}${pathname}`;
  }

  render(): React.Node {
    const { className, i18n, lang, clientApp } = this.props;
    const openSearchTitle =
      clientApp === CLIENT_APP_ANDROID
        ? i18n.t('Firefox Add-ons for Android')
        : i18n.t('Firefox Add-ons');
    return (
      <>
        <Helmet>
          <link
            title={openSearchTitle}
            rel="search"
            type="application/opensearchdescription+xml"
            href={`/${lang}/${clientApp}/opensearch.xml`}
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
            selectSuggestionText={i18n.t('Go to the add-on page')}
            showInputLabel={false}
          />
        </form>
      </>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  const { api } = state;

  return { lang: api.lang, clientApp: api.clientApp };
}

const SearchForm: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(SearchFormBase);

export default SearchForm;
