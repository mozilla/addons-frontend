import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import { convertFiltersToQueryParams } from 'core/searchUtils';

import './styles.scss';

export class SearchFormBase extends React.Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    className: PropTypes.string,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.string,
    router: PropTypes.object.isRequired,
  }

  onSearch = (filters) => {
    this.props.router.push({
      pathname: this.baseSearchURL(),
      query: convertFiltersToQueryParams(filters),
    });
  }

  onSuggestionSelected = (suggestion) => {
    this.props.router.push(suggestion.url);
  }

  baseSearchURL() {
    const { api, pathname } = this.props;
    return `/${api.lang}/${api.clientApp}${pathname}`;
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

export function mapStateToProps(state) {
  return { api: state.api };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(SearchFormBase);
