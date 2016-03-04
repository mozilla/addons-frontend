import React, { PropTypes } from 'react';

import { gettext as _ } from 'core/utils';


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
        <input ref="query" type="search" name="q" placeholder={_('Search')} />
        <button ref="submit" type="submit">{_('Search')}</button>
      </form>
    );
  }
}
