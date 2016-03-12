import React, { PropTypes } from 'react';

import { gettext as _ } from 'core/utils';

import 'search/css/SearchForm.scss';
import 'search/css/lib/buttons.scss';

export default class SearchForm extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this.state = {query: props.query};
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSearch(this.state.query);
  }

  handleChange = () => {
    this.setState({query: this.refs.query.value});
  }

  render() {
    const { query } = this.state;

    return (
      <form ref="form" className="search-form" onSubmit={this.handleSubmit}>
        <label className="visually-hidden" htmlFor="q">{_('Search')}</label>
        <input ref="query" type="search" name="q" placeholder={_('Search')} value={query}
          onChange={this.handleChange}
        />
        <button className="button" ref="submit" type="submit">{_('Search')}</button>
      </form>
    );
  }
}
