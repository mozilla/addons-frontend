import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import { INSTALL_SOURCE_SEARCH } from 'core/constants';
import translate from 'core/i18n/translate';
import { hasSearchFilters } from 'core/searchUtils';


class SearchResults extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    filters: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool,
    paginator: PropTypes.node,
    results: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    count: 0,
    filters: {},
    results: [],
  }

  render() {
    const { count, filters, i18n, loading, paginator, results } = this.props;
    const { query } = filters;

    let loadingMessage;
    let messageText;

    if (loading) {
      loadingMessage = (
        <div
          className="visually-hidden"
          ref={(ref) => { this.loadingText = ref; }}
        >
          {i18n.gettext('Searching…')}
        </div>
      );
    } else if (count === 0 && hasSearchFilters(filters)) {
      if (query) {
        messageText = i18n.sprintf(
          i18n.gettext('No results were found for "%(query)s".'), { query });
      } else {
        // TODO: Add the extension type, if available, so it says
        // "no extensions" found that match your search or something.
        messageText = i18n.gettext('No results were found.');
      }
    } else if (!hasSearchFilters(filters)) {
      messageText = i18n.gettext(
        'Please enter a search term to search Firefox Add-ons.');
    }

    return (
      <div ref={(ref) => { this.container = ref; }} className="SearchResults">
        {loadingMessage}
        <AddonsCard
          addonInstallSource={INSTALL_SOURCE_SEARCH}
          addons={hasSearchFilters(filters) ? results : null}
          footer={paginator}
          header={i18n.gettext('Search results')}
          loading={loading}
        >
          {messageText ? (
            <p
              ref={(ref) => { this.message = ref; }}
              className="SearchResults-message"
            >
              {messageText}
            </p>
          ) : null}
        </AddonsCard>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(SearchResults);
