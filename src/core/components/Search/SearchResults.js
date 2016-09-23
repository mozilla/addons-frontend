import React, { PropTypes } from 'react';
import { sprintf } from 'jed';

import { gettext as _ } from 'core/utils';

import 'core/css/SearchResults.scss';

import SearchResult from './SearchResult';


export default class SearchResults extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    lang: PropTypes.string.isRequired,
    loading: PropTypes.bool,
    query: PropTypes.string,
    results: PropTypes.arrayOf(PropTypes.object),
    ResultComponent: PropTypes.object.isRequired,
  }

  static defaultProps = {
    count: 0,
    query: null,
    ResultComponent: SearchResult,
    results: [],
  }

  render() {
    const { count, lang, loading, query, ResultComponent,
            results } = this.props;

    let searchResults;
    let messageText;
    let hideMessageText = false;

    if (query && count > 0) {
      hideMessageText = true;
      messageText = sprintf(
        _('Your search for "%(query)s" returned %(count)s results.'), { query, count });
      searchResults = (
        <ul className="SearchResults-list"
            ref={(ref) => { this.results = ref; }}>
          {results.map((result) => (
            <ResultComponent result={result} key={result.slug} lang={lang} />
          ))}
        </ul>
      );
    } else if (query && loading) {
      messageText = _('Searching...');
    } else if (query && results.length === 0) {
      messageText = sprintf(_('No results were found for "%(query)s".'), { query });
    } else if (query !== null) {
      messageText = _('Please supply a valid search');
    }

    const message = messageText ?
      <p className={hideMessageText ? 'visually-hidden' : ''}
         ref={(ref) => { this.message = ref; }}>{messageText}</p> : null;

    return (
      <div ref={(ref) => { this.container = ref; }} className="SearchResults">
        {message}
        {searchResults}
      </div>
    );
  }
}
