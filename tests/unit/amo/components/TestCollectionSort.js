import * as React from 'react';

import CollectionSort, {
  CollectionSortBase,
} from 'amo/components/CollectionSort';
import { COLLECTION_SORT_NAME } from 'core/constants';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...otherProps } = {}) => {
    const props = {
      filters: {},
      i18n: fakeI18n(),
      onSortSelect: sinon.stub(),
      ...otherProps,
    };

    return shallowUntilTarget(
      <CollectionSort {...props} />,
      CollectionSortBase,
    );
  };

  it('renders a sort select', () => {
    const sort = COLLECTION_SORT_NAME;
    const onSortSelect = sinon.stub();

    const root = render({ filters: { collectionSort: sort }, onSortSelect });

    expect(root.find('.CollectionSort-label')).toHaveText('Sort add-ons by');
    expect(root.find('.CollectionSort-select')).toHaveProp(
      'defaultValue',
      sort,
    );
    expect(root.find('.CollectionSort-select')).toHaveProp(
      'onChange',
      onSortSelect,
    );

    const options = root.find('.CollectionSort-select').children();
    root
      .instance()
      .sortOptions()
      .forEach((option, index) => {
        expect(options.at(index)).toHaveProp('value', option.value);
        expect(options.at(index)).toHaveText(option.children);
      });
  });

  it('executes onSortSelect when a sort is selected', () => {
    const onSortSelect = sinon.spy();

    const root = render({ onSortSelect });

    const event = createFakeEvent();
    const select = root.find('.CollectionSort-select');
    select.simulate('change', event);

    sinon.assert.calledWith(onSortSelect, event);
  });
});
