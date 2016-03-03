import React, { PropTypes } from 'react';

export default class SearchResults extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    query: null,
    results: [],
  }

  render() {
    const { query, results } = this.props;
    const searchResultsClass = 'search-results';

    let searchResults;

    if (query && results.length > 0) {
      searchResults = (
        <div className={searchResultsClass}>
          <p ref="message">Your search for "{query}" returned {results.length} results.</p>
          <ul ref="results">
            {results.map((result) => <li key={result.title}>{result.title}</li>)}
          </ul>
        </div>
      );
    } else if (query && results.length === 0) {
      searchResults = (
        <div className={searchResultsClass}>
          <p ref="message">No results were found for "{query}".</p>
        </div>
      );
    } else if (query !== null) {
      searchResults = (
        <div className={searchResultsClass}>
          <p ref="message">Please supply a valid search</p>
        </div>
      );
    }

    return (
      <div ref="container" className="search-results">
        {searchResults}
      </div>
    );
  }
}
