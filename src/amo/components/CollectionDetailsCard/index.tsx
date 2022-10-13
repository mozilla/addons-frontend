import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import CollectionDetails from 'amo/components/CollectionDetails';
import CollectionManager from 'amo/components/CollectionManager';
import { getCurrentUser, hasPermission } from 'amo/reducers/users';
import { FEATURED_THEMES_COLLECTION_EDIT, FEATURED_THEMES_COLLECTION_SLUG, MOZILLA_COLLECTIONS_EDIT } from 'amo/constants';
import type { CollectionFilters, CollectionType } from 'amo/reducers/collections';
import type { AppState } from 'amo/store';

export type Props = {
  collection: CollectionType | null;
  creating: boolean;
  editing: boolean;
  filters: CollectionFilters;
};
type PropsFromState = {
  editingCollectionDetails: boolean;
  hasEditPermission: boolean;
  hasMaintainerPermission: boolean;
};
type InternalProps = Props & PropsFromState;
export const CollectionDetailsCardBase = ({
  collection,
  creating,
  editing,
  editingCollectionDetails,
  filters,
  hasEditPermission,
  hasMaintainerPermission,
}: InternalProps): React.ReactNode => {
  if (creating || editingCollectionDetails) {
    return <CollectionManager collection={collection} creating={creating} filters={filters} />;
  }

  return <CollectionDetails collection={collection} editing={editing} filters={filters} hasEditPermission={hasEditPermission} showEditButton={hasMaintainerPermission && !editing} />;
};

const mapStateToProps = (state: AppState, ownProps: InternalProps): PropsFromState => {
  const {
    collection,
  } = ownProps;
  const currentUser = getCurrentUser(state.users);
  const isOwner = collection && currentUser && collection.authorId === currentUser.id;
  let hasEditPermission = false;
  let hasMaintainerPermission = false;

  if (collection && currentUser) {
    const mozillaUserId = config.get('mozillaUserId');
    hasEditPermission = isOwner || // User can edit mozilla collections, and it is a mozilla collection.
    collection.authorId === mozillaUserId && hasPermission(state, MOZILLA_COLLECTIONS_EDIT);
    hasMaintainerPermission = hasEditPermission || // User can maintain the featured themes collection, and it is the featured
    // themes collection.
    collection.authorId === mozillaUserId && collection.slug === FEATURED_THEMES_COLLECTION_SLUG && hasPermission(state, FEATURED_THEMES_COLLECTION_EDIT);
  }

  return {
    editingCollectionDetails: state.collections.editingCollectionDetails,
    hasEditPermission,
    hasMaintainerPermission,
  };
};

const CollectionDetailsCard: React.ComponentType<Props> = compose(connect(mapStateToProps))(CollectionDetailsCardBase);
export default CollectionDetailsCard;