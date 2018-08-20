/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import CollectionDetails from 'amo/components/CollectionDetails';
import CollectionManager from 'amo/components/CollectionManager';
import { getCurrentUser, hasPermission } from 'amo/reducers/users';
import {
  FEATURED_THEMES_COLLECTION_EDIT,
  FEATURED_THEMES_COLLECTION_SLUG,
  MOZILLA_COLLECTIONS_EDIT,
  MOZILLA_COLLECTIONS_USERNAME,
} from 'core/constants';
import type {
  CollectionFilters,
  CollectionType,
} from 'amo/reducers/collections';
import type { AppState } from 'amo/store';

export type Props = {|
  collection: CollectionType | null,
  creating: boolean,
  editing: boolean,
  filters: CollectionFilters,
|};

type InternalProps = {|
  ...Props,
  hasEditPermission: boolean,
  showEditButton: boolean,
|};

export class CollectionDetailsCardBase extends React.Component<InternalProps> {
  render() {
    const {
      collection,
      creating,
      editing,
      filters,
      hasEditPermission,
      showEditButton,
    } = this.props;

    const managingCollection = creating || (editing && hasEditPermission);
    if (managingCollection) {
      return (
        <CollectionManager
          collection={collection}
          creating={creating}
          filters={filters}
        />
      );
    }

    return (
      <CollectionDetails
        collection={collection}
        editing={editing}
        filters={filters}
        showEditButton={showEditButton && !editing}
      />
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: InternalProps) => {
  const { collection } = ownProps;

  const currentUser = getCurrentUser(state.users);

  const isOwner =
    collection && currentUser && collection.authorId === currentUser.id;
  let hasEditPermission = false;
  let showEditButton = false;

  if (collection && currentUser) {
    hasEditPermission =
      isOwner ||
      // User can edit mozilla collections, and it is a mozilla collection.
      (collection.authorUsername === MOZILLA_COLLECTIONS_USERNAME &&
        hasPermission(state, MOZILLA_COLLECTIONS_EDIT));
    showEditButton =
      hasEditPermission ||
      // User can maintain the featured themes collection, and it is the featured
      // themes collection.
      (collection.authorUsername === MOZILLA_COLLECTIONS_USERNAME &&
        collection.slug === FEATURED_THEMES_COLLECTION_SLUG &&
        hasPermission(state, FEATURED_THEMES_COLLECTION_EDIT));
  }

  return {
    hasEditPermission,
    showEditButton,
  };
};

const CollectionDetailsCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
)(CollectionDetailsCardBase);

export default CollectionDetailsCard;
