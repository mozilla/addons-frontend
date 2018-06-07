/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import { INSTALL_SOURCE_SEARCH } from 'core/constants';
import translate from 'core/i18n/translate';
import { hasSearchFilters } from 'core/searchUtils';
import type { I18nType } from 'core/types/i18n';


type Props = {|
  count: number,
  filters: Object,
  i18n: I18nType,
  loading: boolean,
  paginator?: React.Node,
  results: Array<Object>,
|};

export class SearchResultsBase extends React.Component<Props> {
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
        <div className="visually-hidden">
          {i18n.gettext('Searching…')}
        </div>
      );
    } else if (count === 0 && hasSearchFilters(filters)) {
      if (query) {
        messageText = i18n.sprintf(i18n.gettext(
          'No results were found for "%(query)s".'),
        { query }
        );
      } else {
        // TODO: Add the extension type, if available, so it says
        // "no extensions" found that match your search or something.
        messageText = i18n.gettext('No results were found.');
      }
    } else if (!hasSearchFilters(filters)) {
      messageText = i18n.gettext(
        'Please enter a search term to search Firefox Add-ons.'
      );
    }

    return (
      <div className="SearchResults">
        {loadingMessage}
        <AddonsCard
          addonInstallSource={INSTALL_SOURCE_SEARCH}
          addons={hasSearchFilters(filters) ? results : null}
          footer={paginator}
          header={i18n.gettext('Search results')}
          loading={loading}
        >
          {messageText ? (
            <p className="SearchResults-message">
              {messageText}
            </p>
          ) : null}
        </AddonsCard>
      </div>
    );
  }
}

export default compose(
  translate(),
)(SearchResultsBase);
