import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { loadEntities } from 'core/actions';
import { fetchAddon } from 'core/api';
import { gettext as _ } from 'core/utils';

import 'core/css/SearchForm.scss';
import 'core/css/lib/buttons.scss';

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
    this.goToSearch(this.refs.query.value);
  }

  render() {
    const { pathname, query } = this.props;
    return (
      <form ref="form" className="search-form" method="GET"
            action={pathname} onSubmit={this.handleSearch}>
        <label className="visually-hidden" htmlFor="q">{_('Search')}</label>
        <input ref="query" type="search" name="q" placeholder={_('Search')}
               defaultValue={query} />
        <button className="button button-middle" type="submit" title="Enter"
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
