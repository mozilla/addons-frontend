import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import { gettext as _ } from 'core/utils';

import 'search/css/SearchResults.scss';


export default class SearchResults extends React.Component {
  static propTypes = {
    loading: PropTypes.bool,
    query: PropTypes.string,
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    query: null,
    results: [],
  }

  render() {
    const { loading, query, results } = this.props;

    let searchResults;
    let messageText;

    if (query && results.length > 0) {
      messageText = _(`Your search for "${query}" returned ${results.length} results.`);
      searchResults = (
        <ul ref="results">
          {results.map((result) => (
            <li key={result.slug}>
              <Link to={`/search/addons/${result.slug}`}>{result.name}</Link>
            </li>
          ))}
        </ul>
      );
    } else if (query && loading) {
      messageText = _('Searching...');
    } else if (query && results.length === 0) {
      messageText = _(`No results were found for "${query}".`);
    } else if (query !== null) {
      messageText = _('Please supply a valid search');
    }

    const message = messageText ? <p ref="message">{messageText}</p> : null;

    return (
      <div ref="container" className="search-results">
        {message}
        {searchResults}
      </div>
    );
  }
}
