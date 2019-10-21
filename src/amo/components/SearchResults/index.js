/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import Paginate from 'core/components/Paginate';
import { INSTALL_SOURCE_FEATURED, INSTALL_SOURCE_SEARCH } from 'core/constants';
import translate from 'core/i18n/translate';
import type { SearchFilters } from 'core/api/search';
import type { AddonType, CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

type Props = {|
  count: number,
  filters: SearchFilters,
  loading: boolean,
  paginator?: React.Element<typeof Paginate> | null,
  results: Array<AddonType | CollectionAddonType>,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class SearchResultsBase extends React.Component<InternalProps> {
  static defaultProps = {
    count: 0,
    filters: {},
    results: [],
  };

  render() {
    const { count, filters, i18n, loading, paginator, results } = this.props;
    const { query } = filters;

    let loadingMessage;
    let messageText;

    if (loading) {
      loadingMessage = (
        <div className="visually-hidden">{i18n.gettext('Searching…')}</div>
      );
    } else if (count === 0) {
      if (query) {
        messageText = i18n.sprintf(
          i18n.gettext('No results were found for "%(query)s".'),
          { query },
        );
      } else {
        // TODO: Add the extension type, if available, so it says
        // "no extensions" found that match your search or something.
        messageText = i18n.gettext('No results were found.');
      }
    }

    const addonInstallSource = filters.recommended
      ? INSTALL_SOURCE_FEATURED
      : INSTALL_SOURCE_SEARCH;

    return (
      <div className="SearchResults">
        {loadingMessage}
        <AddonsCard
          addonInstallSource={addonInstallSource}
          addons={results}
          footer={paginator}
          header={i18n.gettext('Search results')}
          loading={loading}
        >
          {messageText ? (
            <p className="SearchResults-message">{messageText}</p>
          ) : null}
        </AddonsCard>
      </div>
    );
  }
}

const SearchResults: React.ComponentType<Props> = compose(translate())(
  SearchResultsBase,
);

export default SearchResults;
