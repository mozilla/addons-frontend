import React, { PropTypes } from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import translate from 'core/i18n/translate';

import './SearchResults.scss';


class SearchResults extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    filters: PropTypes.object,
    hasSearchParams: PropTypes.bool,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool,
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    count: 0,
    filters: {},
    hasSearchParams: false,
    results: [],
  }

  render() {
    const {
      count, hasSearchParams, filters, i18n, loading, results,
    } = this.props;
    const { query } = filters;

    let messageText;

    if (loading) {
      messageText = i18n.gettext('Searching...');
    } else if (count === 0 && hasSearchParams) {
      if (query) {
        messageText = i18n.sprintf(
          i18n.gettext('No results were found for "%(query)s".'), { query });
      } else {
        // TODO: Add the extension type, if available, so it says
        // "no extensions" found that match your search or something.
        messageText = i18n.gettext('No results were found.');
      }
    } else if (!hasSearchParams) {
      messageText = i18n.gettext(
        'Please enter a search term to search Mozilla Add-ons.');
    }

    return (
      <div ref={(ref) => { this.container = ref; }} className="SearchResults">
        <AddonsCard addons={hasSearchParams ? results : null}>
          {messageText ? (
            <p ref={(ref) => { this.message = ref; }}
              className="SearchResults-message">
              {messageText}
            </p>
          ) : null}
        </AddonsCard>
      </div>
    );
  }
}

export default translate({ withRef: true })(SearchResults);
