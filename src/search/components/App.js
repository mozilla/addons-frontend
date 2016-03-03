import React from 'react';

import SearchForm from './SearchForm';
import SearchResults from './SearchResults';

export default class App extends React.Component {

  state = {
    query: null,
    results: [],
  }

  handleSearch = (query) => {
    const results = [{title: 'Foo'}, {title: 'Bar'}, {title: 'Baz'}];
    this.setState({ query, results });
  }

  render() {
    const { query, results } = this.state;
    return (
      <div className="search-app">
        <h1>Add-on Search</h1>
        <SearchForm onSearch={this.handleSearch} />
        <SearchResults results={results} query={query} />
      </div>
    );
  }
}
