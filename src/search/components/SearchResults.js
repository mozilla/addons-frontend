import React, { PropTypes } from 'react';
import { sprintf } from 'jed';

import { gettext as _ } from 'core/utils';
import SearchResult from 'search/components/SearchResult';

import 'search/css/SearchResults.scss';


export default class SearchResults extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    loading: PropTypes.bool,
    query: PropTypes.string,
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    count: 0,
    query: null,
    results: [],
  }

  render() {
    const { count, loading, query, results } = this.props;

    let searchResults;
    let messageText;

    if (query && count > 0) {
      messageText = sprintf(
        _('Your search for "%(query)s" returned %(count)s results.'), { query, count });
      searchResults = (
        <ul ref="results" className="search-results">
          {results.map((result) => <li key={result.slug}><SearchResult result={result} /></li>)}
        </ul>
      );
    } else if (query && loading) {
      messageText = _('Searching...');
    } else if (query && results.length === 0) {
      messageText = sprintf(_('No results were found for "%(query)s".'), { query });
    } else if (query !== null) {
      messageText = _('Please supply a valid search');
    }

    const message = messageText ? <p ref="message">{messageText}</p> : null;

    return (
      <div ref="container" className="search-page">
        {message}
        {searchResults}
      </div>
    );
  }
}
