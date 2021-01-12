import * as React from 'react';
import config from 'config';

import CollectionDetailsCard, {
  CollectionDetailsCardBase,
} from 'amo/components/CollectionDetailsCard';
import CollectionDetails from 'amo/components/CollectionDetails';
import CollectionManager from 'amo/components/CollectionManager';
import {
  beginEditingCollectionDetails,
  finishEditingCollectionDetails,
} from 'amo/reducers/collections';
import {
  FEATURED_THEMES_COLLECTION_EDIT,
  FEATURED_THEMES_COLLECTION_SLUG,
  MOZILLA_COLLECTIONS_EDIT,
} from 'amo/constants';
import {
  createFakeCollectionDetail,
  createInternalCollectionWithLang,
  dispatchSignInActions,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const mozillaUserId = config.get('mozillaUserId');

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
    return createInternalCollectionWithLang({
      detail: createFakeCollectionDetail({
        authorId,
        authorUsername,
        slug,
      }),
    });
  };

  it('renders a configured CollectionDetails when not creating or editing', () => {
    const collection = createFakeCollection();
    const filters = { page: '1' };

    const root = render({
      collection,
      creating: false,
      editing: false,
      filters,
    });

    const details = root.find(CollectionDetails);
    expect(details).toHaveProp('collection', collection);
    expect(details).toHaveProp('filters', filters);
    expect(details).toHaveProp('hasEditPermission', false);
  });

  it('configures CollectionDetails when editing and user is the owner of the collection', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });
    const editing = true;

    const root = render({
      collection,
      editing,
      store,
    });

    const details = root.find(CollectionDetails);
    expect(details).toHaveProp('editing', editing);
    expect(details).toHaveProp('hasEditPermission', true);
  });

  it('configures CollectionDetails when editing a mozilla collection when user has the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [MOZILLA_COLLECTIONS_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorId: mozillaUserId,
    });
    const editing = true;

    const root = render({ collection, editing, store });

    const details = root.find(CollectionDetails);
    expect(details).toHaveProp('editing', editing);
    expect(details).toHaveProp('hasEditPermission', true);
  });

  it('configures CollectionDetails when editing the Featured Themes collection when user has only the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [FEATURED_THEMES_COLLECTION_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorId: mozillaUserId,
      slug: FEATURED_THEMES_COLLECTION_SLUG,
    });
    const editing = true;

    const root = render({ collection, editing, store });

    const details = root.find(CollectionDetails);
    expect(details).toHaveProp('editing', editing);
    expect(details).toHaveProp('hasEditPermission', false);
  });

  it('requests an edit link for a mozilla collection when user has the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: [MOZILLA_COLLECTIONS_EDIT],
      },
    });

    const collection = createFakeCollection({
      authorId: mozillaUserId,
    });

    const root = render({ collection, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('does not request an edit link for a mozilla collection when user does not have the `Admin:Curation` permission', () => {
    const { store } = dispatchSignInActions();

    const collection = createFakeCollection({
      authorId: mozillaUserId,
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
      authorId: mozillaUserId,
      slug: FEATURED_THEMES_COLLECTION_SLUG,
    });

    const root = render({ collection, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', true);
  });

  it('does not request an edit link for a the Featured Themes collection when user does not have the `Collections:Contribute` permission', () => {
    const { store } = dispatchSignInActions();

    const collection = createFakeCollection({
      authorId: mozillaUserId,
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

  it('does not request an edit link when user is not the collection owner', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: 99 });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });

    const root = render({ collection, store });
    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('does not request an edit link in edit mode', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });

    const root = render({ collection, editing: true, store });

    expect(root.find(CollectionDetails)).toHaveProp('showEditButton', false);
  });

  it('renders a configured CollectionManager when creating', () => {
    const collection = null;
    const filters = { page: '1' };

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

  it('switches between the CollectionDetails and the CollectionManager when the editingCollectionDetails state changes', () => {
    const authorUserId = 11;
    const { store } = dispatchSignInActions({ userId: authorUserId });

    const collection = createFakeCollection({
      authorId: authorUserId,
    });

    let root = render({ collection, editing: true, store });

    expect(root.find(CollectionDetails)).toHaveLength(1);
    expect(root.find(CollectionManager)).toHaveLength(0);

    store.dispatch(beginEditingCollectionDetails());

    root = render({ collection, editing: true, store });

    expect(root.find(CollectionDetails)).toHaveLength(0);
    expect(root.find(CollectionManager)).toHaveLength(1);

    store.dispatch(finishEditingCollectionDetails());

    root = render({ collection, editing: true, store });

    expect(root.find(CollectionDetails)).toHaveLength(1);
    expect(root.find(CollectionManager)).toHaveLength(0);
  });
});
