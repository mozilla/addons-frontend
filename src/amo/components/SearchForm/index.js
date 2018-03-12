/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import type {
  SearchFilters, SuggestionType,
} from 'amo/components/AutoSearchInput';
import type { ApiStateType } from 'core/reducers/api';
import type { ReactRouterType } from 'core/types/router';

import './styles.scss';

type Props = {|
  apiLang: string | null,
  className?: string,
  clientApp: string | null,
  pathname: string,
  query?: string,
  router: ReactRouterType,
|};

export class SearchFormBase extends React.Component<Props> {
  onSearch = (filters: SearchFilters) => {
    this.props.router.push({
      pathname: this.baseSearchURL(),
      query: convertFiltersToQueryParams(filters),
    });
  }

  onSuggestionSelected = (suggestion: SuggestionType) => {
    this.props.router.push(suggestion.url);
  }

  baseSearchURL() {
    const { apiLang, clientApp, pathname } = this.props;
    return `/${apiLang || ''}/${clientApp || ''}${pathname}`;
  }

  render() {
    const { className, query } = this.props;

    return (
      <form
        action={this.baseSearchURL()}
        className={makeClassName('SearchForm', className)}
        method="GET"
        data-no-csrf
      >
        <AutoSearchInput
          inputName="q"
          onSearch={this.onSearch}
          onSuggestionSelected={this.onSuggestionSelected}
          query={query}
        />
      </form>
    );
  }
}

export function mapStateToProps(
  state: {| api: ApiStateType |}
): $Shape<Props> {
  const { api } = state;

  return { apiLang: api.lang, clientApp: api.clientApp };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(SearchFormBase);
