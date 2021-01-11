import * as React from 'react';

import CollectionDetails, {
  CollectionDetailsBase,
} from 'amo/components/CollectionDetails';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import {
  beginEditingCollectionDetails,
  collectionEditUrl,
  collectionUrl,
  convertFiltersToQueryParams,
} from 'amo/reducers/collections';
import {
  createFakeCollectionDetail,
  createFakeEvent,
  createInternalCollectionWithLang,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...otherProps } = {}) => {
    const props = {
      collection: createInternalCollectionWithLang({
        detail: createFakeCollectionDetail(),
      }),
      editing: false,
      filters: {},
      i18n: fakeI18n(),
      showEditButton: false,
      store: dispatchSignInActions().store,
      ...otherProps,
    };

    return shallowUntilTarget(
      <CollectionDetails {...props} />,
      CollectionDetailsBase,
    );
  };

  it('renders collection details', () => {
    const authorName = 'Collection author';
    const count = 99;
    const description = 'Collection description';
    const modified = 'Jan 1, 1999';
    const name = 'Collection Name';
    const collection = createInternalCollectionWithLang({
      detail: createFakeCollectionDetail({
        authorName,
        count,
        description,
        modified: new Date(modified),
        name,
      }),
    });

    const root = render({ collection });

    expect(root.find('.CollectionDetails-title').children()).toHaveText(name);
    expect(root.find('.CollectionDetails-description').html()).toContain(
      description,
    );
    expect(root.find(MetadataCard).prop('metadata')).toEqual([
      {
        content: count,
        title: 'Add-ons',
      },
      {
        content: authorName,
        title: 'Creator',
      },
      {
        content: modified,
        title: 'Last updated',
      },
    ]);
  });

  it('can handle a blank name', () => {
    const collection = createInternalCollectionWithLang({
      detail: createFakeCollectionDetail({
        name: null,
      }),
    });

    const root = render({ collection });

    expect(root.find('.CollectionDetails-title').children()).toHaveText(
      'Blank Name',
    );
  });

  it('allows HTML entities in the Collection description', () => {
    const description = 'Apples &amp; carrots';
    const collection = createInternalCollectionWithLang({
      detail: createFakeCollectionDetail({
        description,
      }),
    });

    const root = render({ collection });

    expect(root.find('.CollectionDetails-description').html()).toContain(
      description,
    );
  });

  it('renders loading indicators when there is no collection', () => {
    const root = render({ collection: null });

    expect(
      root.find('.CollectionDetails-title').find(LoadingText),
    ).toHaveLength(1);
    expect(
      root.find('.CollectionDetails-description').find(LoadingText),
    ).toHaveLength(1);
    root
      .find(MetadataCard)
      .prop('metadata')
      .forEach((item) => {
        expect(item.content).toEqual(null);
      });
  });

  it('does not render buttons when there is no collection', () => {
    const root = render({ collection: null });

    expect(root.find('.CollectionDetails-edit-button')).toHaveLength(0);
    expect(root.find('.CollectionDetails-edit-details-button')).toHaveLength(0);
    expect(
      root.find('.CollectionDetails-back-to-collection-button'),
    ).toHaveLength(0);
  });

  it('renders an edit button if requested', () => {
    const authorUsername = 'some-username';
    const slug = 'some-slug';
    const collection = createInternalCollectionWithLang({
      detail: createFakeCollectionDetail({ authorUsername, slug }),
    });
    const filters = { page: '1' };

    const root = render({ collection, filters, showEditButton: true });

    const editButton = root.find('.CollectionDetails-edit-button');
    expect(editButton).toHaveLength(1);
    expect(editButton).toHaveProp('to', {
      pathname: collectionEditUrl({ collection }),
      query: convertFiltersToQueryParams(filters),
    });
  });

  it('does not render an edit button if not requested', () => {
    const root = render({ showEditButton: false });

    expect(root.find('.CollectionDetails-edit-button')).toHaveLength(0);
  });

  it('does not render an edit button when editing', () => {
    const root = render({
      editing: true,
      showEditButton: true,
    });

    expect(root.find('.CollectionDetails-edit-button')).toHaveLength(0);
  });

  it('renders an edit collection details button if the user has edit permission', () => {
    const root = render({ editing: true, hasEditPermission: true });

    expect(root.find('.CollectionDetails-edit-details-button')).toHaveLength(1);
  });

  it('does not render an edit collection details button if the user does not have edit permission', () => {
    const root = render({ editing: true, hasEditPermission: false });

    expect(root.find('.CollectionDetails-edit-details-button')).toHaveLength(0);
  });

  it('renders a back to collection link if requested and editing', () => {
    const authorUsername = 'some-username';
    const slug = 'some-slug';
    const collection = createInternalCollectionWithLang({
      detail: createFakeCollectionDetail({ authorUsername, slug }),
    });
    const filters = { page: '1' };

    const root = render({ collection, filters, editing: true });

    expect(
      root.find('.CollectionDetails-back-to-collection-button'),
    ).toHaveProp('to', {
      pathname: collectionUrl({ collection }),
      query: convertFiltersToQueryParams(filters),
    });
  });

  it('dispatches beginEditingCollectionDetails when the edit details button is clicked', () => {
    const { store } = dispatchSignInActions();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ editing: true, hasEditPermission: true, store });

    const clickEvent = createFakeEvent();
    root
      .find('.CollectionDetails-edit-details-button')
      .simulate('click', clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.called(clickEvent.stopPropagation);
    sinon.assert.calledWith(dispatchSpy, beginEditingCollectionDetails());
  });
});
