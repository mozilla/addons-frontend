import classNames from 'classnames';
import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

import 'core/css/SearchResults.scss';

import SearchResult from './SearchResult';


class SearchResults extends React.Component {
  static propTypes = {
    ResultComponent: PropTypes.object.isRequired,
    count: PropTypes.number,
    filters: PropTypes.object,
    hasSearchParams: PropTypes.bool,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool,
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    ResultComponent: SearchResult,
    count: 0,
    filters: {},
    hasSearchParams: false,
    results: [],
  }

  render() {
    const {
      ResultComponent, count, hasSearchParams, filters, i18n, loading, results,
    } = this.props;
    const { query } = filters;

    let hideMessageText = false;
    let messageText;
    let resultHeader;
    let searchResults;

    if (hasSearchParams && count > 0) {
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
    } else if (hasSearchParams && loading) {
      messageText = i18n.gettext('Searching...');
    } else if (!loading && count === 0) {
      if (query) {
        messageText = i18n.sprintf(
          i18n.gettext('No results were found for "%(query)s".'), { query });
      } else if (hasSearchParams) {
        // TODO: Add the extension type, if available, so it says
        // "no extensions" found that match your search or something.
        messageText = i18n.gettext('No results were found.');
      } else {
        messageText = i18n.gettext(
          'Please enter a search term to search Mozilla Add-ons.');
      }
    }

    const message = (
      (<p ref={(ref) => { this.message = ref; }} className={classNames({
        'visually-hidden': hideMessageText,
        'SearchResults-message': !hideMessageText,
      })}>{messageText}</p>)
    );

    return (
      <div ref={(ref) => { this.container = ref; }} className="SearchResults">
        {resultHeader}
        {message}
        {searchResults}
      </div>
    );
  }
}

export default translate({ withRef: true })(SearchResults);
