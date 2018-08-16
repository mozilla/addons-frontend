/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import {
  collectionEditUrl,
  collectionUrl,
  convertFiltersToQueryParams,
} from 'amo/reducers/collections';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export type Props = {|
  collection: CollectionType | null,
  editing: boolean,
  filters: CollectionFilters,
  hasEditPermission: boolean,
  showEditButton: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class CollectionDetailsBase extends React.Component<InternalProps> {
  render() {
    const {
      collection,
      editing,
      filters,
      hasEditPermission,
      i18n,
      showEditButton,
    } = this.props;

    return (
      <div className="CollectionDetails">
        <h1 className="CollectionDetails-title">
          {collection ? collection.name : <LoadingText />}
        </h1>
        <p className="CollectionDetails-description">
          {collection ? (
            <span
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(collection.description)}
            />
          ) : (
            <LoadingText />
          )}
        </p>
        <MetadataCard
          metadata={[
            {
              content: collection ? collection.numberOfAddons : null,
              title: i18n.gettext('Add-ons'),
            },
            {
              content: collection ? collection.authorName : null,
              title: i18n.gettext('Creator'),
            },
            {
              content: collection
                ? i18n.moment(collection.lastUpdatedDate).format('ll')
                : null,
              title: i18n.gettext('Last updated'),
            },
          ]}
        />
        {collection &&
          showEditButton &&
          !editing && (
            <Button
              buttonType="neutral"
              className="CollectionDetails-edit-button"
              puffy
              to={{
                pathname: collectionEditUrl({ collection }),
                query: convertFiltersToQueryParams(filters),
              }}
            >
              {i18n.gettext('Edit this collection')}
            </Button>
          )}
        {collection &&
          editing &&
          hasEditPermission && (
            <Button
              buttonType="neutral"
              className="CollectionDetails-edit-button"
              puffy
              to={{
                pathname: collectionEditUrl({ collection }),
                query: convertFiltersToQueryParams(filters),
              }}
            >
              {i18n.gettext('Edit collection details')}
            </Button>
          )}
        {collection &&
          editing && (
            <Button
              buttonType="cancel"
              className="CollectionDetails-back-to-collection-button"
              to={{
                pathname: collectionUrl({ collection }),
                query: convertFiltersToQueryParams(filters),
              }}
            >
              {i18n.gettext('Back to collection')}
            </Button>
          )}
      </div>
    );
  }
}

const CollectionDetails: React.ComponentType<Props> = compose(translate())(
  CollectionDetailsBase,
);

export default CollectionDetails;
