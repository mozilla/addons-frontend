import React, { PropTypes } from 'react';

import { gettext as _ } from 'core/utils';

import 'search/css/SearchForm.scss';
import 'search/css/lib/buttons.scss';

export default class SearchForm extends React.Component {
  static propTypes = {
    pathname: PropTypes.string.isRequired,
    query: PropTypes.string,
  }
  static contextTypes = {
    router: PropTypes.object,
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { pathname } = this.props;
    const query = this.refs.query.value;
    this.context.router.push(`${pathname}?q=${query}`);
  }

  render() {
    const { query } = this.props;
    return (
      <form ref="form" className="search-form" onSubmit={this.handleSubmit}>
        <label className="visually-hidden" htmlFor="q">{_('Search')}</label>
        <input ref="query" type="search" name="q" placeholder={_('Search')} defaultValue={query} />
        <button className="button" ref="submit" type="submit">{_('Search')}</button>
      </form>
    );
  }
}
