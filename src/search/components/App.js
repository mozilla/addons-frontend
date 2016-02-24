import React from 'react';

import SearchForm from './SearchForm';
import SearchResults from './SearchResults';

export default class App extends React.Component {
  state = {query: '', results: []}

  handleSearch = (query) => {
    const results = [{title: 'Foo'}, {title: 'Bar'}, {title: 'Baz'}];
    this.setState({ query, results });
  }

  render() {
    const { query, results } = this.state;
    return (
      <div className="search-app">
        <SearchForm onSearch={this.handleSearch} />
        <SearchResults results={results} query={query} />
      </div>
    );
  }
}
