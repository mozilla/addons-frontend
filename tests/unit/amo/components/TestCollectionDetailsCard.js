import * as React from 'react';

import CollectionDetailsCard, {
  CollectionDetailsCardBase,
} from 'amo/components/CollectionDetailsCard';
import CollectionDetails from 'amo/components/CollectionDetails';
import CollectionManager from 'amo/components/CollectionManager';
import { createInternalCollection } from 'amo/reducers/collections';
import {
  FEATURED_THEMES_COLLECTION_EDIT,
  FEATURED_THEMES_COLLECTION_SLUG,
  MOZILLA_COLLECTIONS_EDIT,
  MOZILLA_COLLECTIONS_USERNAME,
} from 'core/constants';
import { shallowUntilTarget } from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const render = ({ ...otherProps } = {}) => {
    const allProps = {
      collection: null,
      creating: false,
      editing: false,
      filters: {},
      store: dispatchSignInActions().store,
      ...otherProps,
    };

    return shallowUntilTarget(
      <CollectionDetailsCard {...allProps} />,
      CollectionDetailsCardBase,
    );
  };

  const createFakeCollection = ({
    authorId = 1,
    authorUsername = 'some-user',
    slug = 'some-slug',
  } = {}) => {
    return createInternalCollection({
      addons: createFakeCollectionAddons(),
      detail: createFakeCollectionDetail({
        authorId,
        authorUsername,
        slug,
      }),
    });
  };

  it('renders a configured CollectionManager when creating', () => {
    const collection = null;
    const filters = { page: 1 };

    const root = render({
      collection,
      creating: true,
      filters,
    });

    const manager = root.find(CollectionManager);
    expect(manager).toHaveProp('collection', collection);
    expect(manager).toHaveProp('creating', true);
    expect(manager).toHaveProp('filters', filters);
  });

  it('renders a configured CollectionManager when editing and user is the owner of the collection', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });
    const filters = { page: 1 };

    const root = render({
      collection,
      editing: true,
      filters,
      store,
    });

    console.log(root.debug());

    const manager = root.find(CollectionManager);
    expect(manager).toHaveProp('collection', collection);
    expect(manager).toHaveProp('creating', false);
    expect(manager).toHaveProp('filters', filters);
  });

  it('renders a CollectionManager when editing a mozilla collection when user has the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [MOZILLA_COLLECTIONS_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorUsername: MOZILLA_COLLECTIONS_USERNAME,
    });

    const root = render({ collection, editing: true, store });

    expect(root.find(CollectionManager)).toHaveLength(1);
  });

  it('renders CollectionManager when editing and user is the owner of the collection', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });

    const root = render({
      collection,
      editing: true,
      store,
    });

    expect(root.find(CollectionManager)).toHaveLength(1);
  });

  it('renders a configured CollectionDetails when not creating or editing', () => {
    const collection = createFakeCollection();
    const filters = { page: 1 };

    const root = render({
      collection,
      creating: false,
      editing: false,
      filters,
    });

    const details = root.find(CollectionDetails);
    expect(details).toHaveProp('collection', collection);
    expect(details).toHaveProp('filters', filters);
  });

  it('renders CollectionDetails in edit mode for the Featured Themes collection when user has only the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorUsername: MOZILLA_COLLECTIONS_USERNAME,
      slug: FEATURED_THEMES_COLLECTION_SLUG,
    });
    const editing = true;

    const root = render({ collection, editing, store });

    expect(root.find(CollectionDetails)).toHaveProp('editing', editing);
  });

  it('requests an edit link for a mozilla collection when user has the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [MOZILLA_COLLECTIONS_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorUsername: MOZILLA_COLLECTIONS_USERNAME,
    });

    const root = render({ collection, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('does not request an edit link for a mozilla collection when user does not have the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions();

    const collection = createFakeCollection({
      authorUsername: MOZILLA_COLLECTIONS_USERNAME,
    });

    const root = render({ collection, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('requests an edit link for the Featured Themes collection when user has the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorUsername: MOZILLA_COLLECTIONS_USERNAME,
      slug: FEATURED_THEMES_COLLECTION_SLUG,
    });

    const root = render({ collection, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('does not request an edit link in edit mode for the Featured Themes collection when user has only the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorUsername: MOZILLA_COLLECTIONS_USERNAME,
      slug: FEATURED_THEMES_COLLECTION_SLUG,
    });

    const root = render({ collection, editing: true, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('does not request an edit link for a the Featured Themes collection when user does not have the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions();

    const collection = createFakeCollection({
      authorUsername: MOZILLA_COLLECTIONS_USERNAME,
      slug: FEATURED_THEMES_COLLECTION_SLUG,
    });

    const root = render({ collection, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('requests an edit link when user is the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });

    const root = render({ collection, store });
    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('does not render an edit link when user is not the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: 99 });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });

    const root = render({ collection, store });
    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });
});
