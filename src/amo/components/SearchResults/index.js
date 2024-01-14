/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import { INSTALL_SOURCE_FEATURED, INSTALL_SOURCE_SEARCH } from 'amo/constants';
import translate from 'amo/i18n/translate';
import type { SearchFilters } from 'amo/api/search';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

type DefaultProps = {|
  count: number,
  filters: SearchFilters | Object,
  results: Array<AddonType | CollectionAddonType>,
|};

type Props = {|
  ...DefaultProps,
  loading: boolean,
  paginator?: React.Node | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class SearchResultsBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    count: 0,
    filters: {},
    results: [],
  };

  render(): React.Node {
    const { count, filters, i18n, loading, paginator, results } = this.props;
    const { query } = filters;

    let loadingMessage;
    let messageText;

    if (loading) {
      loadingMessage = (
        <div className="visually-hidden">{i18n.t('Searching…')}</div>
      );
    } else if (count === 0) {
      if (query) {
        messageText = i18n.t('No results were found for "%(query)s".', {
          query,
        });
      } else {
        // TODO: Add the extension type, if available, so it says
        // "no extensions" found that match your search or something.
        messageText = i18n.t('No results were found.');
      }
    }

    const addonInstallSource = filters.promoted
      ? INSTALL_SOURCE_FEATURED
      : INSTALL_SOURCE_SEARCH;

    return (
      <div className="SearchResults">
        {loadingMessage}
        <AddonsCard
          addonInstallSource={addonInstallSource}
          addons={results}
          footer={paginator}
          header={i18n.t('Search results')}
          loading={loading}
          showFullSizePreview
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
