/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  beginEditingCollectionDetails,
  collectionEditUrl,
  collectionName,
  collectionUrl,
  convertFiltersToQueryParams,
} from 'amo/reducers/collections';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import LoadingText from 'amo/components/LoadingText';
import MetadataCard from 'amo/components/MetadataCard';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

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
  dispatch: DispatchFunc,
  jed: I18nType,
|};

export class CollectionDetailsBase extends React.Component<InternalProps> {
  onEditDetails: HTMLElementEventHandler = (event: ElementEvent) => {
    const { dispatch } = this.props;

    event.preventDefault();
    event.stopPropagation();

    dispatch(beginEditingCollectionDetails());
  };

  render(): React.Node {
    const {
      collection,
      editing,
      filters,
      hasEditPermission,
      jed,
      showEditButton,
    } = this.props;

    return (
      <div className="CollectionDetails">
        <h1 className="CollectionDetails-title">
          {collection ? (
            collectionName({ name: collection.name, jed })
          ) : (
            <LoadingText />
          )}
        </h1>
        <p className="CollectionDetails-description">
          {collection ? collection.description : <LoadingText />}
        </p>
        <MetadataCard
          metadata={[
            {
              content: collection ? collection.numberOfAddons : null,
              title: jed.gettext('Add-ons'),
            },
            {
              content: collection ? collection.authorName : null,
              title: jed.gettext('Creator'),
            },
            {
              content: collection
                ? jed.moment(collection.lastUpdatedDate).format('ll')
                : null,
              title: jed.gettext('Last updated'),
            },
          ]}
        />
        {collection && showEditButton && !editing && (
          <Button
            buttonType="neutral"
            className="CollectionDetails-edit-button"
            puffy
            to={{
              pathname: collectionEditUrl({ collection }),
              query: convertFiltersToQueryParams(filters),
            }}
          >
            {jed.gettext('Edit this collection')}
          </Button>
        )}
        {collection && editing && hasEditPermission && (
          <Button
            buttonType="neutral"
            className="CollectionDetails-edit-details-button"
            puffy
            href="#editdetails"
            onClick={this.onEditDetails}
          >
            {jed.gettext('Edit collection details')}
          </Button>
        )}
        {collection && editing && (
          <Button
            buttonType="cancel"
            className="CollectionDetails-back-to-collection-button"
            to={{
              pathname: collectionUrl({ collection }),
              query: convertFiltersToQueryParams(filters),
            }}
          >
            {jed.gettext('Back to collection')}
          </Button>
        )}
      </div>
    );
  }
}

const CollectionDetails: React.ComponentType<Props> = compose(
  translate(),
  connect(),
)(CollectionDetailsBase);

export default CollectionDetails;
