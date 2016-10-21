import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { loadEntities } from 'core/actions';
import { fetchAddon } from 'core/api';
import { gettext as _ } from 'core/utils';
import CentredInput from 'ui/components/CentredInput';

import 'core/css/inc/lib.scss';
import './SearchForm.scss';


export class SearchFormBase extends React.Component {
  static propTypes = {
    pathname: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
  }
  static contextTypes = {
    router: PropTypes.object,
  }

  goToSearch(query) {
    const { pathname } = this.props;
    this.context.router.push(`${pathname}?q=${query}`);
  }

  handleSearch = (e) => {
    e.preventDefault();
    this.goToSearch(this.searchQuery.value);
  }

  render() {
    const { pathname, query } = this.props;
    return (
      <form method="GET" action={pathname} onSubmit={this.handleSearch}
            className="SearchForm-form" ref={(ref) => { this.form = ref; }}>
        <CentredInput
          inputRef={(ref) => { this.searchQuery = ref; }} type="search" name="q"
          defaultValue={query} className="SearchForm-query" offset={31}
        >
          <i className="Icon-magnifying-glass" />
          <span>{_('Search extensions and themes')}</span>
        </CentredInput>
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
