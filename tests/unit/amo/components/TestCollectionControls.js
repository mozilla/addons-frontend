import * as React from 'react';
import { shallow } from 'enzyme';

import CollectionControls from 'amo/components/CollectionControls';
import CollectionSort from 'amo/components/CollectionSort';
import { createInternalCollection } from 'amo/reducers/collections';
import { COLLECTION_SORT_NAME } from 'core/constants';
import { createFakeCollectionDetail } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...otherProps } = {}) => {
    const props = {
      collection: createInternalCollection({
        detail: createFakeCollectionDetail(),
      }),
      editing: true,
      filters: {},
      ...otherProps,
    };

    return shallow(<CollectionControls {...props} />);
  };

  it('renders a CollectionSort component', () => {
    const collection = createInternalCollection({
      detail: createFakeCollectionDetail(),
    });
    const editing = true;
    const filters = { collectionSort: COLLECTION_SORT_NAME };

    const root = render({ collection, editing, filters });

    expect(root.find(CollectionSort)).toHaveProp('collection', collection);
    expect(root.find(CollectionSort)).toHaveProp('editing', editing);
    expect(root.find(CollectionSort)).toHaveProp('filters', filters);
  });
});
