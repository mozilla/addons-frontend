import React, { PropTypes } from 'react';

export default class SearchResults extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    results: PropTypes.string,
  }

  static defaultProps = {
    query: '',
    results: [],
  }

  render() {
    const { query, results } = this.props;
    return (
      <div className="search-results">
        <h3>Your search for "{query}" returned {results.length} results.</h3>
        {results.map((result) => <div key={result.title}>{result.title}</div>)}
      </div>
    );
  }
}
