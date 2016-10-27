import classNames from 'classnames';
import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

import 'core/css/SearchResults.scss';

import SearchResult from './SearchResult';


class SearchResults extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    i18n: PropTypes.object.isRequired,
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
    const {
      ResultComponent, count, i18n, loading, query, results,
    } = this.props;

    let searchResults;
    let messageText;
    let hideMessageText = false;

    if (query && count > 0) {
      hideMessageText = true;
      messageText = i18n.sprintf(
        i18n.ngettext(
          'Your search for "%(query)s" returned %(count)s result.',
          'Your search for "%(query)s" returned %(count)s results.',
          count,
        ),
        { query, count }
      );
      searchResults = (
        <ul className="SearchResults-list"
            ref={(ref) => { this.results = ref; }}>
          {results.map((result) => (
            <ResultComponent result={result} key={result.slug} />
          ))}
        </ul>
      );
    } else if (query && loading) {
      messageText = i18n.gettext('Searching...');
    } else if (query && results.length === 0) {
      messageText = i18n.sprintf(
        i18n.gettext('No results were found for "%(query)s".'), { query });
    } else if (query !== null) {
      messageText = i18n.gettext('Please supply a valid search');
    }

    const message = messageText ?
      <p ref={(ref) => { this.message = ref; }} className={classNames({
        'visually-hidden': hideMessageText,
        'SearchReuslts-message': !hideMessageText,
      })}>{messageText}</p> : null;

    return (
      <div ref={(ref) => { this.container = ref; }} className="SearchResults">
        {message}
        {searchResults}
      </div>
    );
  }
}

export default translate({ withRef: true })(SearchResults);
