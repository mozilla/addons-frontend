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
    query: PropTypes.string.isRequired,
    router: PropTypes.object.isRequired,
  }

  onSearch = (filters) => {
    const { api, pathname, router } = this.props;

    router.push({
      pathname: `/${api.lang}/${api.clientApp}${pathname}`,
      query: convertFiltersToQueryParams(filters),
    });
  }

  onSuggestionSelected = (suggestion) => {
    this.props.router.push(suggestion.url);
  }

  render() {
    const {
      api,
      className,
      pathname,
      query,
    } = this.props;

    const inputName = 'q';
    // TODO: file a bug about support non-javascript form submissions maybe
    return (
      <form
        action={`/${api.lang}/${api.clientApp}${pathname}`}
        className={makeClassName('SearchForm', className)}
        method="GET"
        ref={(ref) => { this.form = ref; }}
        data-no-csrf
      >
        <AutoSearchInput
          inputName={inputName}
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
