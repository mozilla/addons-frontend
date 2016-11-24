import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { loadEntities } from 'core/actions';
import { fetchAddon } from 'core/api';
import { gettext as _ } from 'core/utils';
import SearchInput from 'ui/components/SearchInput';

import 'core/css/inc/lib.scss';
import './SearchForm.scss';


export class SearchFormBase extends React.Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
  }
  static contextTypes = {
    router: PropTypes.object,
  }

  goToSearch(query) {
    const { api, pathname } = this.props;
    this.context.router.push(
      `/${api.lang}/${api.clientApp}${pathname}?q=${query}`);
  }

  handleSearch = (e) => {
    e.preventDefault();
    this.searchQuery.input.blur();
    this.goToSearch(this.searchQuery.value);
  }

  render() {
    const { api, pathname, query } = this.props;
    return (
      <form method="GET" action={`/${api.lang}/${api.clientApp}${pathname}`}
        onSubmit={this.handleSearch} className="SearchForm-form"
        ref={(ref) => { this.form = ref; }}>
        <label className="visually-hidden" htmlFor="q">{_('Search')}</label>
        <SearchInput
          ref={(ref) => { this.searchQuery = ref; }} type="search" name="q"
          placeholder={_('Search extensions and themes')}
          defaultValue={query} className="SearchForm-query" />
        <button className="visually-hidden" type="submit" title="Enter"
                ref={(ref) => { this.submitButton = ref; }}
                onClick={this.handleSearch}>
          {_('Search')}
        </button>
      </form>
    );
  }
}

export function mapStateToProps({ api }) {
  return { api };
}

export function mapDispatchToProps(dispatch) {
  return {
    loadAddon({ api, query }) {
      return fetchAddon({ slug: query, api })
        .then(({ entities, result }) => {
          dispatch(loadEntities(entities));
          return result;
        });
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchFormBase);
