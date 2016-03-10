import React, { PropTypes } from 'react';

import { gettext as _ } from 'core/utils';

import 'search/css/SearchForm.scss';
import 'search/css/lib/buttons.scss';

export default class SearchForm extends React.Component {
  static propTypes = {
    onSearch: PropTypes.func.isRequired,
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSearch(this.refs.query.value);
  }

  render() {
    return (
      <form ref="form" className="search-form" onSubmit={this.handleSubmit}>
        <label className="visually-hidden" htmlFor="q">{_('Search')}</label>
        <input ref="query" type="search" name="q" placeholder={_('Search')} />
        <button className="button" ref="submit" type="submit">{_('Search')}</button>
      </form>
    );
  }
}
