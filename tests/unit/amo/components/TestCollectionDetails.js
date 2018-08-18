import * as React from 'react';

import CollectionDetails, {
  CollectionDetailsBase,
} from 'amo/components/CollectionDetails';
import LoadingText from 'ui/components/LoadingText';
import MetadataCard from 'ui/components/MetadataCard';
import {
  collectionEditUrl,
  collectionUrl,
  convertFiltersToQueryParams,
  createInternalCollection,
} from 'amo/reducers/collections';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import { createFakeCollectionDetail } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const render = ({ ...otherProps } = {}) => {
    const props = {
      collection: createInternalCollection({
        detail: createFakeCollectionDetail(),
      }),
      editing: false,
      filters: {},
      i18n: fakeI18n(),
      showEditButton: false,
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
    const collection = createInternalCollection({
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

  it('allows HTML entities in the Collection description', () => {
    const description = 'Apples &amp; carrots';
    const collection = createInternalCollection({
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

  it('renders an edit button if requested', () => {
    const authorUsername = 'some-username';
    const slug = 'some-slug';
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername, slug }),
    });
    const filters = { page: 1 };

    const root = render({ collection, filters, showEditButton: true });

    const editButton = root.find('.CollectionDetails-action-button');
    expect(editButton).toHaveLength(1);
    expect(editButton).toHaveProp('buttonType', 'neutral');
    expect(editButton).toHaveProp('puffy', true);
    expect(editButton).toHaveProp('to', {
      pathname: collectionEditUrl({ collection }),
      query: convertFiltersToQueryParams(filters),
    });
    expect(editButton.children()).toHaveText('Edit this collection');
  });

  it('renders a done editing button if requested and editing', () => {
    const authorUsername = 'some-username';
    const slug = 'some-slug';
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail({ authorUsername, slug }),
    });
    const filters = { page: 1 };

    const root = render({ collection, filters, editing: true });

    const editButton = root.find('.CollectionDetails-action-button');
    expect(editButton).toHaveLength(1);
    expect(editButton).toHaveProp('buttonType', 'neutral');
    expect(editButton).toHaveProp('puffy', true);
    expect(editButton).toHaveProp('to', {
      pathname: collectionUrl({ collection }),
      query: convertFiltersToQueryParams(filters),
    });
    expect(editButton.children()).toHaveText('Done editing');
  });

  it('does not render an edit button if not requested', () => {
    const root = render({ showEditButton: false });

    expect(root.find('.CollectionDetails-action-button')).toHaveLength(0);
  });
});
